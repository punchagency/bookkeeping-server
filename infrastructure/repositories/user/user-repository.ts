import { injectable } from "tsyringe";

import { Repository } from "../repository";
import { IUserRepository } from "./i-user-repository";
import { UserModel, User } from "../../../domain/entities/user";

@injectable()
export class UserRepository
  extends Repository<User>
  implements IUserRepository
{
  constructor() {
    super(UserModel);
  }

  async findByEmail(email: string): Promise<User | null> {
    return await UserModel.findOne({ email })
      .select("+password +verificationMethod")
      .exec();
  }

  async updatePassword(
    userId: string,
    hashedPassword: string
  ): Promise<User | null> {
    return await UserModel.findByIdAndUpdate(
      userId,
      { password: hashedPassword },
      { new: true }
    );
  }

  async findByPhoneNumber(phoneNumber: string): Promise<User | null> {
    return await UserModel.findOne({ phoneNumber: `+${phoneNumber}` })
      .select("-password +verificationMethod")
      .exec();
  }
}
