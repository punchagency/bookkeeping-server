import { Types } from "mongoose";
import { Request, Response } from "express";
import { injectable, inject } from "tsyringe";
import { Result } from "./../../../application/result";
import { User } from "./../../../domain/entities/user";
import { getTransactionsSchema } from "./get-transaction.dto";
import MxClient from "./../../../infrastructure/config/packages/mx";
import { TransactionRepository } from "./../../../infrastructure/repositories/transaction/transaction-repository";
import { ITransactionRepository } from "../../../infrastructure/repositories/transaction/i-transaction-repository";

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

    const countResponse = await this._mxClient.client.listTransactions(
      mxUserId,
      undefined,
      1,
      1
    );

    const totalTransactions = countResponse.data.pagination.total_entries;
    const totalPages = Math.ceil(totalTransactions / 1000);

    let allTransactions: any[] = [];
    for (let page = 1; page <= totalPages; page++) {
      const batchResponse = await this._mxClient.client.listTransactions(
        mxUserId,
        undefined,
        page,
        1000
      );
      allTransactions = [
        ...allTransactions,
        ...batchResponse.data.transactions,
      ];
    }

    const paginatedTransactionsResponse =
      await this._mxClient.client.listTransactions(
        mxUserId,
        undefined,
        currentPage,
        perPage
      );

    if (paginatedTransactionsResponse.status !== 200) {
      return Result.Fail([{ message: "Error fetching transactions from MX" }]);
    }

    const totals = allTransactions.reduce(
      (acc, t) => {
        if (t.is_income) acc.totalIncome += Number(t.amount);
        if (t.is_expense) acc.totalExpenses += Number(t.amount);
        return acc;
      },
      { totalIncome: 0, totalExpenses: 0 }
    );

    const formattedTotals = {
      income: Number(totals.totalIncome.toFixed(2)),
      expenses: Number(totals.totalExpenses.toFixed(2)),
      netChange: Number(totals.totalIncome - totals.totalExpenses),
    };

    const paginatedTransactions =
      paginatedTransactionsResponse.data.transactions;
    const transformedTransactions = paginatedTransactions.map((t: any) => ({
      category: t.category,
      date: t.date,
      status: t.status,
      topLevelCategory: t.top_level_category,
      type: t.type,
      accountId: t.account_id,
      userId: new Types.ObjectId(currentUser._id),
      accountGuid: t.account_guid,
      amount: t.amount,
      currencyCode: t.currency_code,
      description: t.description,
      guid: t.guid,
      transactionId: t.id,
      isExpense: t.is_expense,
      isIncome: t.is_income,
      memo: t.memo,
      originalDescription: t.original_description,
      memberGuid: t.member_guid,
      userGuid: t.user_guid,
      metadata: {
        merchantCategoryCode: t.merchant_category_code,
        merchantGuid: t.merchant_guid,
        classification: t.classification,
        extendedTransactionType: t.extended_transaction_type,
      },
      isDeleted: false,
    }));

    await this._transactionRepository.insertMany(transformedTransactions);

    const responseData = {
      transactions: transformedTransactions,
      pagination: {
        currentPage: paginatedTransactionsResponse.data.pagination.current_page,
        perPage: paginatedTransactionsResponse.data.pagination.per_page,
        totalEntries:
          paginatedTransactionsResponse.data.pagination.total_entries,
        totalPages: paginatedTransactionsResponse.data.pagination.total_pages,
      },
      totals: formattedTotals,
    };

    return Result.Ok(responseData);
  }
}
