import dayjs from "dayjs";
import bcrypt from "bcrypt";
import { Request, Response } from "express";
import { injectable, inject } from "tsyringe";

import signupSchema from "./signup.dto";
import signupEventEmitter from "./event";
import { logger } from "./../../../utils";
import { Result } from "./../../../application/result";
import { User } from "./../../../domain/entities/user";
import { ISignupEvent, SIGNUP_EVENT } from "./event.dto";
import { AuthTokenUtils } from "./../../../utils/auth-token";
import { TokenType } from "./../../../domain/entities/token";
import MxClient from "../../../infrastructure/config/packages/mx";
import { UserRepository } from "../../../infrastructure/repositories/user/user-repository";
import { IUserRepository } from "../../../infrastructure/repositories/user/i-user-repository";
import { TokenRepository } from "../../../infrastructure/repositories/token/token-repository";
import { ITokenRepository } from "../../../infrastructure/repositories/token/i-token-repository";

@injectable()
export default class SignupHandler {
  private readonly _mxClient: MxClient;
  private readonly _authTokenUtils: AuthTokenUtils;
  private readonly _userRepository: IUserRepository;
  private readonly _tokenRepository: ITokenRepository;

  constructor(
    @inject(MxClient.name) mxClient: MxClient,
    @inject(AuthTokenUtils.name) authTokenUtils: AuthTokenUtils,
    @inject(UserRepository.name) userRepository: IUserRepository,
    @inject(TokenRepository.name) tokenRepository: ITokenRepository
  ) {
    this._mxClient = mxClient;
    this._userRepository = userRepository;
    this._authTokenUtils = authTokenUtils;
    this._tokenRepository = tokenRepository;
  }

  public async handle(req: Request, res: Response) {
    const values = await signupSchema.validateAsync(req.body);

    const userExists = await this._userRepository.findByEmail(values.email);

    if (userExists) {
      return Result.Fail([{ message: "User already exists" }]).withMetadata({
        statusCode: 409,
      });
    }

    const hashedPassword = await bcrypt.hash(values.password, 10);

    const userToCreate: Partial<User> = {
      email: values.email,
      password: hashedPassword,
      fullName: values.fullName,
    };

    const user = await this._userRepository.create(userToCreate as User);

    /**
     * Now, we can create the MX user
     */

    const dataToSend = {
      user: {
        email: values.email,
        id: user._id.toString(),
      },
    };

    try {
      const createMxUserResponse = await this._mxClient.client.createUser(
        dataToSend
      );

      const newMxUser = createMxUserResponse.data.user;

      const mxUserDetails = {
        mxUserId: newMxUser.guid,
        email: values.email,
        id: newMxUser.id,
        metadata: null,
        createdAt: new Date(),
      };

      await this._userRepository.update(user._id, {
        mxUsers: [
          ...(user.mxUsers || []),
          {
            ...mxUserDetails,
            isDisabled: false,
          },
        ],
      });

      const createdOtpToken = await this._tokenRepository.create({
        userId: user._id,
        expiresAt: dayjs().add(1, "hour").toDate(),
        token: this._authTokenUtils.generateOtpToken(),
        type: TokenType.OTP,
      });

      const signupEvent: ISignupEvent = {
        fullName: values.fullName,
        email: values.email,
        otp: createdOtpToken.token,
      };

      signupEventEmitter.emit(SIGNUP_EVENT, signupEvent);

      return Result.Ok("Account created. Please check your email for the OTP.");
    } catch (error: any) {
      return Result.Fail([{ message: "Error creating mx user" }]).withMetadata({
        statusCode: 500,
      });
    }
  }
}
