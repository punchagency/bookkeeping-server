import twilio from "twilio";
import { injectable, inject } from "tsyringe";

import { EnvConfiguration } from "../../../../utils";

@injectable()
export default class TwilioClient {
  private readonly _envConfiguration: EnvConfiguration;
  public readonly client: twilio.Twilio;

  constructor(
    @inject(EnvConfiguration.name) envConfiguration: EnvConfiguration
  ) {
    this._envConfiguration = envConfiguration;
    this.client = twilio(
      this._envConfiguration.TWILIO_ACCOUNT_SID,
      this._envConfiguration.TWILIO_AUTH_TOKEN
    );
  }
}
