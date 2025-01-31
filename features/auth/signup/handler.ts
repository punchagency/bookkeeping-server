import { Request, Response } from "express";
import { injectable } from "tsyringe";

import signupSchema from "./signup.dto";
import { Result } from "./../../../application/result";

@injectable()
export default class SignupHandler {
  public async handle(req: Request, res: Response) {
    const values = await signupSchema.validateAsync(req.body);

    return Result.Ok(values);
  }
}
