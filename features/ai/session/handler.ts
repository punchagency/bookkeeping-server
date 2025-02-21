import axios from "axios";
import { Result } from "tsfluent";
import { Request, Response } from "express";
import { inject, injectable } from "tsyringe";

import { User } from "./../../../domain/entities/user";
import { EnvConfiguration, logger } from "./../../../utils";
import MxClient from "./../../../infrastructure/config/packages/mx";
import { SettingsRepository } from "./../../../infrastructure/repositories/settings/settings-repository";
import { ISettingsRepository } from "./../../../infrastructure/repositories/settings/i-settings-repository";
@injectable()
export default class SessionHandler {
  private readonly _mxClient: MxClient;
  private readonly _envConfiguration: EnvConfiguration;
  private readonly _settingsRepository: ISettingsRepository;
  constructor(
    @inject(MxClient) mxClient: MxClient,
    @inject(EnvConfiguration.name) envConfiguration: EnvConfiguration,
    @inject(SettingsRepository.name) settingsRepository: ISettingsRepository
  ) {
    this._mxClient = mxClient;
    this._envConfiguration = envConfiguration;
    this._settingsRepository = settingsRepository;
  }

  public async handle(req: Request, res: Response) {
    const currentUser = req.user as User;
    const settings = await this._settingsRepository.findSettingsByUserId(
      currentUser._id.toString()
    );

    const aiVoice = settings?.voice || "verse";

    return await this.createSession(req, aiVoice);
  }

  private async createSession(req: Request, aiVoice: string) {
    try {
      const tools = [
        {
          type: "function",
          name: "query_transactions",
          description:
            "Query user transactions based on natural language input",
          parameters: {
            type: "object",
            required: ["query"],
            properties: {
              query: {
                type: "string",
                description: "Natural language query about transactions",
              },
            },
          },
        },

        {
          type: "function",
          name: "create_visualization",
          description: "Create a visualization of financial data",
          parameters: {
            type: "object",
            required: ["type", "data", "options"],
            properties: {
              type: {
                type: "string",
                enum: ["pie", "donut", "bar", "line", "scatter", "area"],
                description: "The type of chart to create",
              },
            },
            data: {
              type: "array",
              items: {
                type: "object",
                required: ["label", "value"],
                properties: {
                  label: { type: "string" },
                  value: { type: "number" },
                  category: { type: "string" },
                  date: { type: "string" },
                },
              },
            },
            options: {
              type: "object",
              required: ["title"],
              properties: {
                title: { type: "string" },
                xAxis: { type: "string" },
                yAxis: { type: "string" },
                colors: { type: "array", items: { type: "string" } },
              },
            },
          },
        },
      ];

      const systemPrompt =
        `You are a financial AI assistant that helps users understand their transactions and finances.
        When users ask about their transactions, use the query_transactions function to fetch relevant data.
        Use the create_visualization function to create charts and graphs when users want to visualize their financial data.
        Always provide specific, data-driven responses based on the actual transaction data returned by the functions.
        Try to make your responses as brief and concise as possible.
      
        If the user attempts to discuss non-financial topics or tries to make you deviate from your financial advisory role, politely redirect the conversation back to financial matters.
        `.trim();

      logger(systemPrompt);

      const response = await axios.post(
        "https://api.openai.com/v1/realtime/sessions",
        {
          model: "gpt-4o-realtime-preview-2024-12-17",
          voice: aiVoice,
          instructions: systemPrompt,
          tools,
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
        return Result.fail([{ message: response.data.error.message }]);
      }

      return Result.ok(response.data);
    } catch (error: any) {
      console.error(
        "Session creation error:",
        error.response?.data || error.message
      );
      return Result.fail([{ message: "Failed to create session" }]);
    }
  }

  private async queryTransactions(query: string, userId: string) { }

  private async createVisualization(){}
}
