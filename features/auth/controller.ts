import { Request, Response } from "express";
import { inject, injectable } from "tsyringe";

import { logger } from "./../../utils";
import LoginHandler from "./login/handler";
import SignupHandler from "./signup/handler";
import LogoutHandler from "./logout/handler";
import RefreshTokenHandler from "./refresh-token/handler";

import ApiResponse from "./../../application/response/response";
import { IApiResponse } from "./../../application/response/i-response";

@injectable()
export default class AuthController {
  private readonly _apiResponse: IApiResponse;
  private readonly _loginHandler: LoginHandler;
  private readonly _signupHandler: SignupHandler;
  private readonly _logoutHandler: LogoutHandler;
  private readonly _refreshTokenHandler: RefreshTokenHandler;

  constructor(
    @inject(ApiResponse.name) apiResponse: IApiResponse,
    @inject(LoginHandler.name) loginHandler: LoginHandler,
    @inject(SignupHandler.name) signupHandler: SignupHandler,
    @inject(LogoutHandler.name) logoutHandler: LogoutHandler,
    @inject(RefreshTokenHandler.name) refreshTokenHandler: RefreshTokenHandler
  ) {
    this._apiResponse = apiResponse;
    this._loginHandler = loginHandler;
    this._signupHandler = signupHandler;
    this._logoutHandler = logoutHandler;
    this._refreshTokenHandler = refreshTokenHandler;
  }

  public async login(req: Request, res: Response) {
    const loginResult = await this._loginHandler.handle(req, res);

    if (loginResult.isFailure) {
      let errors = loginResult.errors.map((error) => error.message);
      logger(errors);

      return this._apiResponse.BadRequest(res, errors);
    }

    return this._apiResponse.Ok(res, "Login successful", loginResult.value);
  }

  public async signup(req: Request, res: Response) {
    const signupResult = await this._signupHandler.handle(req, res);

    if (signupResult.isFailure) {
      if (signupResult.metadata.statusCode == 409) {
        return this._apiResponse.Conflict(res, "User already exist", null);
      }

      let errors = signupResult.errors.map((error) => error.message);
      return this._apiResponse.BadRequest(res, errors);
    }

    return this._apiResponse.Created(
      res,
      "Account created. Please check your email for the OTP.",
      null
    );
  }

  public async logout(req: Request, res: Response) {
    const logoutResult = await this._logoutHandler.handle(req, res);

    if (logoutResult.isFailure) {
      let errors = logoutResult.errors.map((error) => error.message);
      return this._apiResponse.BadRequest(res, errors);
    }

    return this._apiResponse.Ok(res, "Logout successful", {});
  }

  public async refreshToken(req: Request, res: Response) {
    const refreshTokenResult = await this._refreshTokenHandler.handle(req, res);

    if (refreshTokenResult.isFailure) {
      let errors = refreshTokenResult.errors.map((error) => error.message);

      return this._apiResponse.BadRequest(res, errors);
    }

    return this._apiResponse.Ok(
      res,
      "Access token refreshed successfully",
      refreshTokenResult.value
    );
  }
}
