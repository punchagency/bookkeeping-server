import { Request, Response } from "express";
import { injectable, inject } from "tsyringe";

import { chatDto } from "./chat.dto";
import { logger } from "../../../utils";
import { Result } from "../../../application/result";
import OpenAiClient from "../../../infrastructure/config/packages/openai";
import { TransactionRepository } from "../../../infrastructure/repositories/transaction/transaction-repository";

@injectable()
export default class AIChatHandler {
  private readonly _openAiClient: OpenAiClient;
  private readonly _transactionRepository: TransactionRepository;

  constructor(
    @inject(OpenAiClient) openAiClient: OpenAiClient,
    @inject(TransactionRepository) transactionRepository: TransactionRepository
  ) {
    this._openAiClient = openAiClient;
    this._transactionRepository = transactionRepository;
  }

  public async handle(req: Request, res: Response) {
    try {
      const values = await chatDto.validateAsync(req.body);

      const { message } = values;

      const transactions = await this._transactionRepository.findAll();

      if (transactions.length === 0) {
        return Result.Fail([
          {
            message: "No transactions found. Please connect your bank account.",
          },
        ]);
      }

      const context = `User's transactions: ${JSON.stringify(transactions)}`;

      const completion =
        await this._openAiClient.client.chat.completions.create({
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content:
                "You are a helpful financial assistant. Use the transaction data provided to answer questions accurately.",
            },
            {
              role: "user",
              content: `Context: ${context}\n\nQuestion: ${message}`,
            },
          ],
        });

      const textResponse = completion.choices[0].message.content;

      const speech = await this._openAiClient.client.audio.speech.create({
        model: "tts-1",
        voice: "alloy",
        input: textResponse,
      });

      logger(speech);

      const audioBuffer = Buffer.from(await speech.arrayBuffer());
      const audioBase64 = audioBuffer.toString("base64");

      return Result.Ok({
        text: textResponse,
        audioUrl: `data:audio/mp3;base64,${audioBase64}`,
      });
    } catch (error) {
      logger("AI Chat Error:", error);
      return Result.Fail([{ message: "Failed to process AI chat" }]);
    }
  }
}
