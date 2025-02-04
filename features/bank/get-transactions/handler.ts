import { Request, Response } from "express";
import MxClient from "./../../../infrastructure/config/packages/mx";
import { injectable, inject } from "tsyringe";
import { logger } from "./../../../utils";
import { Result } from "./../../../application/result";
import { User } from "./../../../domain/entities/user";
import { getTransactionsSchema } from "./get-transaction.dto";
import { ITransactionRepository } from "../../../infrastructure/repositories/transaction/i-transaction-repository";
import { TransactionRepository } from "./../../../infrastructure/repositories/transaction/transaction-repository";

@injectable()
export default class GetTransactionsHandler {
  private readonly _mxClient: MxClient;
  private readonly _transactionRepository: ITransactionRepository;

  constructor(
    @inject(MxClient) mxClient: MxClient,
    @inject(TransactionRepository) transactionRepository: ITransactionRepository
  ) {
    this._mxClient = mxClient;
    this._transactionRepository = transactionRepository;
  }

  public async handle(req: Request, res: Response) {
    const result = await this.getTransactions(req);

    if (result.isFailure) {
      return Result.Fail(result.errors);
    }

    return Result.Ok(result.value);
  }

  private async getTransactions(req: Request) {
    const values = await getTransactionsSchema.validateAsync(req.query);

    const currentUser = req.user as User;

    const mxUserId = currentUser.mxUsers[0].mxUserId;

    const { perPage, currentPage } = values;

    const transactionsResponse = await this._mxClient.client.listTransactions(
      mxUserId,
      undefined,
      currentPage,
      perPage
    );

    if (transactionsResponse.status !== 200) {
      return Result.Fail([{ message: "Error fetching transactions from MX" }]);
    }

    logger(transactionsResponse.data.transactions);

    /**
     * Bulk insert transactions into the database
     */
    const transactions = transactionsResponse.data.transactions;

    return Result.Ok(transactionsResponse.data);
  }
}
