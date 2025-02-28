import { container } from "tsyringe";
import TransactionQueueService from "./transaction-queue.service";

export const registerTransactionQueueService = () => {
  container.registerSingleton(TransactionQueueService);
};
