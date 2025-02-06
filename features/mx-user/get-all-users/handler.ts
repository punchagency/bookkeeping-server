import { injectable } from "tsyringe";
import { Request, Response } from "express";

import { Result } from "./../../../application/result";
import { User } from "./../../../domain/entities/user";

@injectable()
export default class GetAllMxUsersHandler {
  public async handle(req: Request, res: Response) {
    try {
      const currentUser = req.user as User;

      return Result.Ok({
        mxUsers: currentUser.mxUsers || [],
      });
    } catch (error: any) {
      return Result.Fail([{ message: "Error fetching MX users" }]);
    }
  }
}
