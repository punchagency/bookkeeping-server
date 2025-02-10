import bcrypt from "bcrypt";
import { Request, Response } from "express";
import { injectable, inject } from "tsyringe";

import loginSchema from "./login.dto";
import { ILoginResponse } from "./login-response";
import { Result } from "../../../application/result";
import { TokenType } from "../../../domain/entities/token";
import { AuthTokenUtils } from "../../../utils/auth-token";
import { UserRepository } from "../../../infrastructure/repositories/user/user-repository";
import { TokenRepository } from "../../../infrastructure/repositories/token/token-repository";

@injectable()
export default class LoginHandler {
  private readonly _userRepository: UserRepository;
  private readonly _tokenRepository: TokenRepository;
  private readonly _authTokenUtils: AuthTokenUtils;

  constructor(
    @inject(UserRepository.name)
    userRepository: UserRepository,
    @inject(TokenRepository.name)
    tokenRepository: TokenRepository,
    @inject(AuthTokenUtils.name) authTokenUtils: AuthTokenUtils
  ) {
    this._userRepository = userRepository;
    this._tokenRepository = tokenRepository;
    this._authTokenUtils = authTokenUtils;
  }

  public async handle(req: Request, res: Response) {
    try {
      const values = await loginSchema.validateAsync(req.body);

      const user = await this._userRepository.findByEmail(values.email);
      if (!user) {
        return Result.Fail([{ message: "Invalid credentials" }]);
      }

      const isPasswordValid = await bcrypt.compare(
        values.password,
        user.password
      );
      if (!isPasswordValid) {
        return Result.Fail([{ message: "Invalid credentials" }]);
      }

      if (!user.isVerified) {
        return Result.Fail([{ message: "User is not verified" }]);
      }

      await this._tokenRepository.deleteRefreshTokens(user._id);

      const accessToken = this._authTokenUtils.generateAccessToken(
        user._id,
        user.email
      );

      const refreshToken = this._authTokenUtils.generateRefreshToken(user._id);

      await this._tokenRepository.create({
        userId: user._id,
        token: refreshToken,
        type: TokenType.REFRESH_TOKEN,
        expiresAt: this._authTokenUtils.getRefreshTokenExpiry(),
        userAgent: req.headers["user-agent"],
      });

      this._authTokenUtils.setRefreshTokenCookie(res, refreshToken);

      return Result.Ok<ILoginResponse>({
        accessToken,
        refreshToken,
        user: {
          _id: user._id,
          email: user.email,
          fullName: user.fullName,
          avatar: `https://api.dicebear.com/9.x/micah/svg?seed=${user.fullName}`,
        },
      });
    } catch (error: any) {
      return Result.Fail([{ message: `${error}` }]);
    }
  }
}
