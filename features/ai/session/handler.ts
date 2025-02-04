import { Request, Response } from "express";
import { inject, injectable } from "tsyringe";
import axios from "axios";
import { EnvConfiguration } from "./../../../utils";
import OpenAiClient from "./../../../infrastructure/config/packages/openai";
import { Result } from "application/result";

@injectable()
export default class SessionHandler {
  private readonly _openAiClient: OpenAiClient;
  private readonly _envConfiguration: EnvConfiguration;

  constructor(
    @inject(OpenAiClient.name) openAiClient: OpenAiClient,
    @inject(EnvConfiguration.name) envConfiguration: EnvConfiguration
  ) {
    this._openAiClient = openAiClient;
    this._envConfiguration = envConfiguration;
  }

  public async handle(req: Request, res: Response) {
    const sessionResult = await this.createSession(req);
    if (sessionResult.isFailure) {
      return Result.Fail(sessionResult.errors);
    }

    return Result.Ok(sessionResult.value);
  }

  private async createSession(req: Request) {
    const response = await axios.post(
      "https://api.openai.com/v1/realtime/sessions",
      {
        headers: {
          Authorization: `Bearer ${this._envConfiguration.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },

        body: {
          model: "gpt-4o-realtime-preview-2024-12-17",
          voice: "verse",
        },
      }
    );

    if (response.status !== 200) {
      return Result.Fail([
        {
          message: "Failed to create session",
        },
      ]);
    }

    return Result.Ok(response.data);
  }
}
