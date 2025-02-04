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
}
