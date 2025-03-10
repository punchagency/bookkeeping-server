import { z } from "zod";
import { Result } from "tsfluent";
import { openai } from "@ai-sdk/openai";
import { embed, generateObject } from "ai";
import { Request, Response } from "express";
import { injectable, inject } from "tsyringe";

import { logger } from "./../../../utils";
import { User } from "../../../domain/entities/user";
import { suggestQuestionsSchema } from "./suggest-questions.dto";
import { Message } from "../../../domain/entities/conversations";
import RedisService from "./../../../infrastructure/services/redis";
import {
  IPromptConversation,
  IQuestionSuggestion,
  IResultMetadataContext,
} from "./type";
import ConversationRepository from "./../../../infrastructure/repositories/conversations/conversation-repository";

@injectable()
export default class SuggestQuestionsHandler {
  private readonly _redisService: RedisService;
  private readonly _conversationRepository: ConversationRepository;
  constructor(
    @inject(RedisService) redisService: RedisService,
    @inject(ConversationRepository)
    conversationRepository: ConversationRepository
  ) {
    this._redisService = redisService;
    this._conversationRepository = conversationRepository;
  }

  public async handle(req: Request, res: Response) {
    const values = await suggestQuestionsSchema.validateAsync(req.params);
    const currentUser = req.user as User;

    const conversations =
      await this._conversationRepository.findUserConversation(
        currentUser._id.toString(),
        values.id as string
      );

    if (!conversations) {
      return Result.fail<IResultMetadataContext>(
        "Conversations not found"
      ).withMetadata({
        context: {
          statusCode: 404,
        },
      });
    }

    const questionsResult = await this.suggestQuestions(
      conversations._id.toString(),
      conversations.messages
    );

    if (!questionsResult.isSuccess) {
      return Result.fail("Failed to suggest questions");
    }

    return Result.ok(questionsResult.value);
  }

  private async suggestQuestions(
    conversationId: string,
    conversations: Message[]
  ) {
    const cachedQuestions = await this.getCachedQuestions(conversationId);

    if (cachedQuestions) {
      logger(`Returning cached questions for conversation ${conversationId}`);
      return Result.ok(cachedQuestions);
    }

    logger(`Cached questions not found for conversation ${conversationId}`);

    logger(`Generating questions for conversation ${conversationId}`);

    const conversationsWithoutTimestamp = conversations.map((c) => ({
      role: c.role,
      content: c.content,
    }));

    const suggestionPrompt = await this.generatePrompt(
      conversationsWithoutTimestamp
    );

    const suggestionsParams = await generateObject({
      model: openai("gpt-4o-mini", {
        structuredOutputs: true,
      }),

      schemaName: "SuggestionParams",
      schemaDescription:
        "SuggestionParams is a schema that defines the parameters for the suggestion questions",
      schema: z.object({
        categories: z.array(
          z.object({
            name: z.string(),
            description: z.string(),
            questions: z.array(
              z.object({
                id: z.string(),
                question: z.string(),
                relevance: z.number(),
                context: z.string(),
              })
            ),
          })
        ),
      }),
      prompt: suggestionPrompt,
    });

    const categories = suggestionsParams.object.categories;

    await this.setCachedQuestions(
      conversationId,
      categories as IQuestionSuggestion[]
    );

    return Result.ok(categories as IQuestionSuggestion[]);
  }

  private async generatePrompt(conversation: IPromptConversation[]) {
    return `
        Analyze the following conversation and generate structured, query-friendly follow-up questions:

        [CONVERSATION]
        ${conversation.map((c) => `${c.role}: ${c.content}`).join("\n")}
        [/CONVERSATION]

        Format the response as a valid JSON object:

        {
            "categories": [
                {
                    "name": "string",
                    "description": "string",
                    "questions": [
                        {
                            "id": "string",
                            "question": "string",
                            "relevance": number (50-100),
                            "context": "string"
                        }
                    ]
                }
            ]
        }

        **Guidelines for Generating Questions:**
        - Questions should be concise, direct, and easily searchable.
        - Use clear, action-oriented phrasing (e.g., "Show me...", "How do I...", "Can you explain...").
        - Structure questions to be user-friendly and relevant to the context.
        - Avoid ambiguity—each question should have a clear intent.
        - Start questions with:
            * "Show me..."
            * "How do I..."
            * "Can you explain..."
            * "Give me insights on..."
            * "Help me analyze..."
            * "What are the key details of..."

        **Example Transformations:**
        ❌ "Would you like insights on your spending?"  
        ✅ "Show me insights on my recent spending"  

        ❌ "How do you want the report?"  
        ✅ "How do I generate a detailed expense report?"  

        ❌ "Do you need help with your transactions?"  
        ✅ "Help me analyze my latest transactions"  

        **Rules:**
        - Generate 3-5 highly relevant questions per category.
        - Max 6 categories to maintain focus.
        - Ensure questions align with past conversation context.
        - Return **valid JSON only**.
    `;
  }

  private async getCachedQuestions(conversationId: string) {
    logger(`Getting cached questions for conversation ${conversationId}`);
    const cachedQuestions = await this._redisService.get(
      `conversation:${conversationId}:questions`
    );

    return cachedQuestions as IQuestionSuggestion[];
  }

  private async setCachedQuestions(
    conversationId: string,
    questions: IQuestionSuggestion[]
  ) {
    logger(`Caching questions for conversation ${conversationId}`);
    await this._redisService.set(
      `conversation:${conversationId}:questions`,
      questions,
      60 * 60 // /1 hour
    );
  }
}
