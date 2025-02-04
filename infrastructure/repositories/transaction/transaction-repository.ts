import { injectable } from "tsyringe";

import { Repository } from "../repository";
import { ITransactionRepository } from "./i-transaction-repository";
import TransactionModel, {
  Transaction,
} from "../../../domain/entities/transactions";

@injectable()
export class TransactionRepository
  extends Repository<Transaction>
  implements ITransactionRepository
{
  constructor() {
    super(TransactionModel);
  }

  public async insertMany(transactions: Transaction[]): Promise<void> {
    // Get all transaction GUIDs we want to insert
    const transactionGuids = transactions.map((t) => t.guid);

    // Find existing transactions with these GUIDs
    const existingTransactions = await TransactionModel.find({
      guid: { $in: transactionGuids },
    });

    // Get GUIDs of existing transactions
    const existingGuids = existingTransactions.map((t) => t.guid);

    // Filter out transactions that already exist
    const newTransactions = transactions.filter(
      (transaction) => !existingGuids.includes(transaction.guid)
    );

    if (newTransactions.length > 0) {
      await TransactionModel.insertMany(newTransactions);
    }
  }
}
