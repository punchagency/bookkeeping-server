import dayjs from "dayjs";
import { Request, Response } from "express";
import { injectable, inject } from "tsyringe";
import { resendOtpSchema } from "./resend-otp.dto";
import { Result } from "../../../application/result";
import { AuthTokenUtils } from "./../../../utils/auth-token";
import { TokenType } from "./../../../domain/entities/token";
import { UserRepository } from "./../../../infrastructure/repositories/user/user-repository";
import { TokenRepository } from "../../../infrastructure/repositories/token/token-repository";
import resendOtpEventEmitter from "./event";
import { RESEND_OTP_EVENT } from "./event.dto";

@injectable()
export default class ResendOtpHandler {
  private readonly _authTokenUtils: AuthTokenUtils;
  private readonly _userRepository: UserRepository;
  private readonly _tokenRepository: TokenRepository;

  constructor(
    @inject(AuthTokenUtils.name) authTokenUtils,
    @inject(UserRepository.name) userRepository,
    @inject(TokenRepository.name) tokenRepository
  ) {
    this._authTokenUtils = authTokenUtils;
    this._userRepository = userRepository;
    this._tokenRepository = tokenRepository;
  }

  public async handle(req: Request, res: Response) {
    const values = await resendOtpSchema.validateAsync(req.body);

    return this.resendOtp(values.otp);
  }

  public async resendOtp(otp: string) {
    const existingOtp = await this._tokenRepository.findByOtp(otp);

    if (!existingOtp) {
      return Result.Fail([{ message: "Invalid or expired token" }]);
    }

    const user = await this._userRepository.findById(existingOtp.userId);

    if (!user) {
      return Result.Fail([{ message: "User not found" }]);
    }

    if (user.isVerified) {
      return Result.Fail([{ message: "User already verified" }]);
    }

    await this._tokenRepository.delete(existingOtp.id);

    const createdOtpToken = await this._tokenRepository.create({
      userId: user._id,
      expiresAt: dayjs().add(1, "hour").toDate(),
      token: this._authTokenUtils.generateOtpToken(),
      type: TokenType.OTP,
    });

    resendOtpEventEmitter.emit(RESEND_OTP_EVENT, {
      fullName: user.fullName,
      email: user.email,
      otp: createdOtpToken.token,
    });

    return Result.Ok("OTP resent successfully");
  }
}
