import { injectable } from "tsyringe";
import { UserModel, User } from "../../../domain/entities/user";
import { Repository } from "../repository";
import { IUserRepository } from "./i-user-repository";

@injectable()
export class UserRepository
  extends Repository<User>
  implements IUserRepository
{
  constructor() {
    super(UserModel);
  }

  async findByEmail(email: string): Promise<User | null> {
    return await UserModel.findOne({ email }).exec();
  }

  async updatePassword(
    userId: string,
    hashedPassword: string
  ): Promise<User | null> {
    return await UserModel.findByIdAndUpdate(
      userId,
      { password: hashedPassword },
      { new: true }
    ).exec();
  }
}
