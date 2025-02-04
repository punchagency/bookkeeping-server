import { OpenAI } from "openai";
import { inject, injectable } from "tsyringe";
import { EnvConfiguration } from "./../../../../utils";

@injectable()
export default class OpenAiClient {
  private readonly _envConfiguration: EnvConfiguration;
  public readonly client: OpenAI;

  constructor(
    @inject(EnvConfiguration.name) envConfiguration: EnvConfiguration
  ) {
    this._envConfiguration = envConfiguration;
    this.client = new OpenAI({
      apiKey: this._envConfiguration.OPENAI_API_KEY,
    });
  }
}
