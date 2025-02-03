import { Request, Response } from "express";
import MxClient from "./../../../infrastructure/config/packages/mx";
import { injectable, inject } from "tsyringe";
import { logger } from "./../../../utils";
import { Result } from "./../../../application/result";
import { User } from "./../../../domain/entities/user";

@injectable()
export default class GetTransactionsHandler {
  private readonly _mxClient: MxClient;

  constructor(@inject(MxClient) mxClient: MxClient) {
    this._mxClient = mxClient;
  }

  public async handle(req: Request, res: Response) {
    const result = await this.getTransactions(req);

    if (result.isFailure) {
      return Result.Fail(result.errors);
    }

    return Result.Ok(result.value);
  }

  private async getTransactions(req: Request) {
    const currentUser = req.user as User;

    const mxUserId = currentUser.mxUsers[0].mxUserId;

    const transactionsResponse = await this._mxClient.client.listTransactions(
      mxUserId
    );

    if (transactionsResponse.status !== 200) {
      return Result.Fail([{ message: "Error fetching transactions from MX" }]);
    }

    logger(transactionsResponse.data.transactions);

    return Result.Ok(transactionsResponse.data.transactions);
  }
}
