import { Types } from "mongoose";
import { injectable } from "tsyringe";
import { Repository } from "../repository";
import { ITokenRepository } from "./i-token-repository";
import { TokenModel, Token, TokenType } from "../../../domain/entities/token";

@injectable()
export class TokenRepository
  extends Repository<Token>
  implements ITokenRepository
{
  constructor() {
    super(TokenModel);
  }

  async findByUserId(userId: Types.ObjectId): Promise<Token | null> {
    return await TokenModel.findOne({ userId }).exec();
  }

  async findByRefreshToken(refreshToken: string): Promise<Token | null> {
    return await TokenModel.findOne({ token: refreshToken }).exec();
  }

  async deleteByUserId(userId: Types.ObjectId): Promise<boolean> {
    const result = await TokenModel.deleteOne({
      userId,
    }).exec();
    return result.deletedCount > 0;
  }

  async deleteRefreshTokens(userId: Types.ObjectId): Promise<boolean> {
    const result = await TokenModel.deleteMany({
      userId,
      type: TokenType.REFRESH_TOKEN,
    }).exec();
    return result.deletedCount > 0;
  }
}
