import jwt from "jsonwebtoken";
import { Types } from "mongoose";
import { Response } from "express";
import { container, injectable, inject } from "tsyringe";

import { EnvConfiguration } from "./env-config";
import { TokenType } from "../domain/entities/token";

@injectable()
export class AuthTokenUtils {
  private readonly _envConfig: EnvConfiguration;

  constructor(@inject(EnvConfiguration.name) envConfig: EnvConfiguration) {
    this._envConfig = envConfig;
  }

  generateAccessToken(userId: Types.ObjectId, email: string): string {
    return jwt.sign(
      {
        sub: userId,
        email,
      },
      this._envConfig.JWT_SECRET,
      {
        expiresIn: "1h",
        issuer: this._envConfig.JWT_ISSUER,
        audience: this._envConfig.JWT_AUDIENCE,
      }
    );
  }

  generateRefreshToken(userId: Types.ObjectId): string {
    return jwt.sign(
      {
        sub: userId,
        type: TokenType.REFRESH_TOKEN,
      },
      this._envConfig.JWT_REFRESH_SECRET,
      {
        expiresIn: "7d",
        issuer: this._envConfig.JWT_ISSUER,
        audience: this._envConfig.JWT_AUDIENCE,
      }
    );
  }

  setRefreshTokenCookie(res: Response, token: string): void {
    res.cookie("refreshToken", token, {
      httpOnly: true,
      secure: this._envConfig.IS_PRODUCTION,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }

  getRefreshTokenExpiry(): Date {
    return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  }
}

export const registerAuthTokenUtilsDi = () => {
  container.register(AuthTokenUtils.name, {
    useClass: AuthTokenUtils,
  });
};
