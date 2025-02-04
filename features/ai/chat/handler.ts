import { Request, Response } from "express";
import { injectable, inject } from "tsyringe";
import { OpenAI } from "openai";
import { TransactionRepository } from "../../../infrastructure/repositories/transaction/transaction-repository";
import { Result } from "../../../application/result";

@injectable()
export default class AIChatHandler {
  private readonly openai: OpenAI;
  private readonly transactionRepository: TransactionRepository;

  constructor(
    @inject(TransactionRepository) transactionRepository: TransactionRepository
  ) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.transactionRepository = transactionRepository;
  }

  public async handle(req: Request, res: Response) {
    try {
      const { message } = req.body;
      const userId = req.user.id;

      // Get relevant transactions
      const transactions = await this.transactionRepository.find({ userId });

      // Create context for GPT
      const context = `User's transactions: ${JSON.stringify(transactions)}`;

      // Get text response from GPT
      const completion = await this.openai.chat.completions.create({
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

      // Generate speech
      const speech = await this.openai.audio.speech.create({
        model: "tts-1",
        voice: "alloy",
        input: textResponse,
      });

      // Convert speech to base64
      const audioBuffer = Buffer.from(await speech.arrayBuffer());
      const audioBase64 = audioBuffer.toString("base64");

      return Result.Ok({
        text: textResponse,
        audioUrl: `data:audio/mp3;base64,${audioBase64}`,
      });
    } catch (error) {
      console.error("AI Chat Error:", error);
      return Result.Fail([{ message: "Failed to process AI chat" }]);
    }
  }
}
