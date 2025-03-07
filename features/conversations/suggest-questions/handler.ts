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
import { IPromptConversation, IResultMetadataContext } from "./type";
import ConversationRepository from "./../../../infrastructure/repositories/conversations/conversation-repository";

@injectable()
export default class SuggestQuestionsHandler {
  private readonly _conversationRepository: ConversationRepository;

  constructor(
    @inject(ConversationRepository)
    conversationRepository: ConversationRepository
  ) {
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

    const questionsResult = await this.suggestQuestions(conversations.messages);

    if (!questionsResult.isSuccess) {
      return Result.fail("Failed to suggest questions");
    }

    return Result.ok(questionsResult.value);
  }

  private async suggestQuestions(conversations: Message[]) {
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

    return Result.ok(categories);
  }

  private async generatePrompt(conversation: IPromptConversation[]) {
    return `
        Analyze the following conversation and generate follow-up questions:

        [CONVERSATION]
        ${conversation.map((c) => `${c.role}: ${c.content}`).join("\n")}
        [/CONVERSATION]

        Generate questions in this JSON format:

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

        Guidelines for questions:
        - Write questions from the user's perspective (e.g., "Can you show me..." instead of "Would you like to see...")
        - Use first-person pronouns (my, I, me) when referring to the user's data
        - Make questions direct and actionable
        - Start questions with phrases like:
        * "Can you show me..."
        * "How do I..."
        * "I want to see..."
        * "Could you help me..."
        * "Show me..."
        * "Help me understand..."

        Example transformations:
        ❌ "What type of chart would you prefer?"
        ✅ "Can you show me this data in a bar chart instead?"

        ❌ "Would you like to see transaction trends?"
        ✅ "Show me the trends in my recent transactions"

        ❌ "How should the data be categorized?"
        ✅ "I want to see my expenses categorized by type"


        Rules:
        - 3-5 relevant questions per category
        - Max 6 categories
        - Questions must be specific and actionable
        - Return valid JSON only
        `;
  }
}
