import { Request, Response } from "express";
import { inject, injectable } from "tsyringe";

import ApiResponse from "./../../application/response/response";
import { IApiResponse } from "./../../application/response/i-response";
import ConnectBankHandler from "./connect-bank/handler";

@injectable()
export default class BankController {
  private readonly _apiResponse: IApiResponse;
  private readonly _connectBankHandler: ConnectBankHandler;

  constructor(
    @inject(ApiResponse) ApiResponse: IApiResponse,
    @inject(ConnectBankHandler) connectBankHandler: ConnectBankHandler
  ) {
    this._apiResponse = ApiResponse;
    this._connectBankHandler = connectBankHandler;
  }

  public async connectBank(req: Request, res: Response) {
    const result = await this._connectBankHandler.handle(req, res);

    if (result.isFailure) {
      return this._apiResponse.BadRequest(res, result.errors);
    }

    return this._apiResponse.Ok(
      res,
      "Bank connected successfully",
      result.value
    );
  }

  public async getConnectedBanks(req: Request, res: Response) {
    return this._apiResponse.Ok(res, "Banks fetched successfully", {});
  }

  public async disconnectBank(req: Request, res: Response) {
    return this._apiResponse.Ok(res, "Bank disconnected successfully", {});
  }
}
