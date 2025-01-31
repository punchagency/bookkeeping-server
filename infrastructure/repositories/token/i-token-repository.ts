import { IRepository } from "../i-repository";
import { Token } from "../../../domain/entities/token";
import { Types } from "mongoose";

export interface ITokenRepository extends IRepository<Token> {
  findByUserId(userId: Types.ObjectId): Promise<Token | null>;
  findByRefreshToken(refreshToken: string): Promise<Token | null>;
  deleteByUserId(userId: Types.ObjectId): Promise<boolean>;
  deleteRefreshTokens(userId: Types.ObjectId): Promise<boolean>;
}
