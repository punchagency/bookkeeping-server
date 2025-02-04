import { Request, Response } from "express";
import { inject, injectable } from "tsyringe";
import axios from "axios";
import { EnvConfiguration } from "./../../../utils";
import { Result } from "./../../../application/result";
import { TransactionRepository } from "../../../infrastructure/repositories/transaction/transaction-repository";

@injectable()
export default class SessionHandler {
  private readonly _envConfiguration: EnvConfiguration;
  private readonly _transactionRepository: TransactionRepository;

  constructor(
    @inject(EnvConfiguration.name) envConfiguration: EnvConfiguration,
    @inject(TransactionRepository) transactionRepository: TransactionRepository
  ) {
    this._envConfiguration = envConfiguration;
    this._transactionRepository = transactionRepository;
  }

  public async handle(req: Request, res: Response) {
    const sessionResult = await this.createSession(req);
    if (sessionResult.isFailure) {
      return Result.Fail(sessionResult.errors);
    }

    return Result.Ok(sessionResult.value);
  }

  private async createSession(req: Request) {
    try {
      const transactions = await this._transactionRepository.findAll();

      const systemPrompt = `
        You are a highly specialized financial assistant designed to analyze and respond exclusively to queries related to personal finance, transactions, budgeting, investments, expenses, savings, and other financial matters.
        
        Here are the user's recent transactions:
        ${JSON.stringify(transactions)}
        
        Your responses must always remain within the financial domain, even if the user tries to divert the conversation to unrelated topics. If a user asks about something non-financial, politely redirect them back to financial-related subjects.
        
        Be concise, clear, and professional, focusing on helping the user make informed financial decisions. Use the transaction data effectively to provide personalized advice when appropriate.
        
        Remember: Do not engage in discussions outside of financial topics under any circumstances.
      `.trim();

      const response = await axios.post(
        "https://api.openai.com/v1/realtime/sessions",
        {
          model: "gpt-4o-realtime-preview-2024-12-17",
          voice: "verse",
          instructions: systemPrompt,
          tools: [
            {
              type: "function",
              name: "analyze_transactions",
              description: "Analyze user transactions for insights",
              parameters: {
                type: "object",
                properties: {
                  transactions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        amount: { type: "number" },
                        description: { type: "string" },
                        date: { type: "string" },
                        category: { type: "string" },
                      },
                    },
                  },
                },
              },
            },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${this._envConfiguration.OPENAI_API_KEY}`,
            "Content-Type": "application/json",
            "OpenAI-Beta": "realtime-1.0.0",
          },
        }
      );

      if (response.data.error) {
        console.error("OpenAI Error:", response.data.error);
        return Result.Fail([{ message: response.data.error.message }]);
      }

      return Result.Ok(response.data);
    } catch (error: any) {
      console.error(
        "Session creation error:",
        error.response?.data || error.message
      );
      return Result.Fail([{ message: "Failed to create session" }]);
    }
  }
}
