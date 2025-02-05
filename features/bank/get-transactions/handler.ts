import { Request, Response } from "express";
import MxClient from "./../../../infrastructure/config/packages/mx";
import { injectable, inject } from "tsyringe";
import { logger } from "./../../../utils";
import { Result } from "./../../../application/result";
import { User } from "./../../../domain/entities/user";
import { getTransactionsSchema } from "./get-transaction.dto";
import { ITransactionRepository } from "../../../infrastructure/repositories/transaction/i-transaction-repository";
import { TransactionRepository } from "./../../../infrastructure/repositories/transaction/transaction-repository";
import { Types } from "mongoose";

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

    // Get all transactions from MX for totals calculation
    const allTransactionsResponse =
      await this._mxClient.client.listTransactions(
        mxUserId,
        undefined,
        1,
        1000 // Get a large number of transactions for accurate totals
      );

    // Calculate totals from all MX transactions
    const totals = allTransactionsResponse.data.transactions.reduce(
      (acc, t) => {
        if (t.is_income) acc.totalIncome += t.amount;
        if (t.is_expense) acc.totalExpenses += t.amount;
        acc.netChange += t.is_income ? t.amount : -t.amount;
        return acc;
      },
      { totalIncome: 0, totalExpenses: 0, netChange: 0 }
    );

    // Format totals to 2 decimal places
    const formattedTotals = {
      income: Number(totals.totalIncome.toFixed(2)),
      expenses: Number(totals.totalExpenses.toFixed(2)),
      netChange: Number(totals.netChange.toFixed(2)),
    };

    // Get paginated transactions for display
    const transactionsResponse = await this._mxClient.client.listTransactions(
      mxUserId,
      undefined,
      currentPage,
      perPage
    );

    if (transactionsResponse.status !== 200) {
      return Result.Fail([{ message: "Error fetching transactions from MX" }]);
    }

    logger(
      `${transactionsResponse.data.transactions.length} transactions fetched`
    );

    const transactions = transactionsResponse.data.transactions;

    const transformedTransactions = transactions.map((t: any) => ({
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
        currentPage: transactionsResponse.data.pagination.current_page,
        perPage: transactionsResponse.data.pagination.per_page,
        totalEntries: transactionsResponse.data.pagination.total_entries,
        totalPages: transactionsResponse.data.pagination.total_pages,
      },
      totals: {
        income: formattedTotals.income,
        expenses: formattedTotals.expenses,
        netChange: formattedTotals.netChange,
      },
    };

    return Result.Ok(responseData);
  }
}
