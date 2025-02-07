import { Request, Response } from "express";
import { injectable, inject } from "tsyringe";

import { verifyOtpSchema } from "./verify-otp.dto";
import { TokenRepository } from "./../../../infrastructure/repositories/token/token-repository";
import { Result } from "./../../../application/result";
import { UserRepository } from "./../../../infrastructure/repositories/user/user-repository";

@injectable()
export default class VerifyOtpHandler {
  private readonly _userRepository: UserRepository;
  private readonly _tokenRepository: TokenRepository;

  constructor(@inject(TokenRepository.name) tokenRepository) {
    this._tokenRepository = tokenRepository;
  }

  public async handle(req: Request, res: Response) {
    const values = await verifyOtpSchema.validateAsync(req.body);

    return this.verifyOtp(values.otp);
  }

  private async verifyOtp(otp: string) {
    const otpExists = await this._tokenRepository.findByOtp(otp);

    if (!otpExists) {
      return Result.Fail([{ message: "Invalid or expired token" }]);
    }

    if (otpExists.expiresAt < new Date()) {
      return Result.Fail([{ message: "Invalid or expired token" }]);
    }

    await this._userRepository.update(otpExists.userId, {
      isVerified: true,
    });

    await this._tokenRepository.delete(otpExists.id);

    return Result.Ok("OTP verified successfully");
  }
}
