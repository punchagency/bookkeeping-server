import { IRepository } from "../i-repository";
import { Transaction } from "./../../../domain/entities/transactions";
import { Types } from "mongoose";

export interface ITransactionRepository extends IRepository<Transaction> {}
