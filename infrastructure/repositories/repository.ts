import { ReturnModelType } from "@typegoose/typegoose";
import { IRepository } from "./i-repository";
import { Types } from "mongoose";

export class Repository<T> implements IRepository<T> {
  private readonly model: ReturnModelType<any>;

  constructor(model: ReturnModelType<any>) {
    this.model = model;
  }

  async create(item: T): Promise<T> {
    return await this.model.create(item);
  }

  async findById(id: Types.ObjectId): Promise<T | null> {
    return await this.model.findById(id).exec();
  }

  async findAll(): Promise<T[]> {
    return await this.model.find().exec();
  }

  async update(id: Types.ObjectId, item: Partial<T>): Promise<T | null> {
    return await this.model.findByIdAndUpdate(id, item, { new: true }).exec();
  }

  async delete(id: Types.ObjectId): Promise<boolean> {
    const result = await this.model.findByIdAndDelete(id).exec();
    return result !== null;
  }
}
