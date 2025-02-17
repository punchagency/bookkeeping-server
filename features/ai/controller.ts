import { Request, Response } from "express";
import { inject, injectable } from "tsyringe";

import SessionHandler from "./session/handler";
import ApiResponse from "./../../application/response/response";
import { IApiResponse } from "./../../application/response/i-response";

@injectable()
export default class AiController {
  private readonly _apiResponse: IApiResponse;
  private readonly _sessionHandler: SessionHandler;

  constructor(
    @inject(SessionHandler.name) sessionHandler: SessionHandler,
    @inject(ApiResponse.name) apiResponse: IApiResponse
  ) {
    this._sessionHandler = sessionHandler;
    this._apiResponse = apiResponse;
  }

  public async createSession(req: Request, res: Response) {
    const result = await this._sessionHandler.handle(req, res);

    if (result.isFailure) {
      return this._apiResponse.BadRequest(res, result.errors);
    }

    return this._apiResponse.Ok(
      res,
      "Session created successfully",
      result.value
    );
  }
}
