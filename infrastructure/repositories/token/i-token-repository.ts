import { IRepository } from "../i-repository";
import { Token, TokenType } from "../../../domain/entities/token";
import { Types } from "mongoose";

export interface ITokenRepository extends IRepository<Token> {
  findByUserId(userId: Types.ObjectId): Promise<Token | null>;
  findByRefreshToken(refreshToken: string): Promise<Token | null>;
  deleteByUserId(userId: Types.ObjectId, type: TokenType): Promise<boolean>;
  deleteRefreshTokens(userId: Types.ObjectId): Promise<boolean>;
  findByOtp(otp: string);
  deleteAllOtpTokens(userId: Types.ObjectId): Promise<any>;
}
