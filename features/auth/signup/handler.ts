import { Request, Response } from "express";
import { injectable, inject } from "tsyringe";

import signupSchema from "./signup.dto";
import { Result } from "./../../../application/result";
import SendgridService from "./../../../infrastructure/config/packages/sendgrid";

@injectable()
export default class SignupHandler {
  private readonly _sendgridService: SendgridService;

  constructor(@inject(SendgridService.name) sendgridService: SendgridService) {
    this._sendgridService = sendgridService;
  }

  public async handle(req: Request, res: Response) {
    const values = await signupSchema.validateAsync(req.body);

    await this._sendgridService.sendEmail(
      "adedoyinemmanuel@punch.agency",
      "Action Required: Testing 1,2,3",
      "Hello World"
    );

    return Result.Ok(values);
  }
}
