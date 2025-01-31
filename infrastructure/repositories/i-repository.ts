import { Types } from "mongoose";

export interface IRepository<T> {
  create(item: T): Promise<T>;
  findById(id: Types.ObjectId): Promise<T | null>;
  findAll(): Promise<T[]>;
  update(id: Types.ObjectId, item: Partial<T>): Promise<T | null>;
  delete(id: Types.ObjectId): Promise<boolean>;
}
