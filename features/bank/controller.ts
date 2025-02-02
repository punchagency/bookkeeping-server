import { Request, Response } from "express";
import { inject, injectable } from "tsyringe";

import ApiResponse from "./../../application/response/response";
import { IApiResponse } from "./../../application/response/i-response";
import ConnectBankHandler from "./connect-bank/handler";
import CurrentBankHandler from "./current/handler";
import GetTransactionsHandler from "./get-transactions/handler";

@injectable()
export default class BankController {
  private readonly _apiResponse: IApiResponse;
  private readonly _connectBankHandler: ConnectBankHandler;
  private readonly _currentBankHandler: CurrentBankHandler;
  private readonly _getTransactionsHandler: GetTransactionsHandler;

  constructor(
    @inject(ApiResponse) ApiResponse: IApiResponse,
    @inject(ConnectBankHandler) connectBankHandler: ConnectBankHandler,
    @inject(CurrentBankHandler) currentBankHandler: CurrentBankHandler,
    @inject(GetTransactionsHandler)
    getTransactionsHandler: GetTransactionsHandler
  ) {
    this._apiResponse = ApiResponse;
    this._connectBankHandler = connectBankHandler;
    this._currentBankHandler = currentBankHandler;
    this._getTransactionsHandler = getTransactionsHandler;
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

  public async getCurrentBank(req: Request, res: Response) {
    const result = await this._currentBankHandler.handle(req, res);

    if (result.isFailure) {
      return this._apiResponse.BadRequest(res, result.errors);
    }

    return this._apiResponse.Ok(
      res,
      "Current bank fetched successfully",
      result.value
    );
  }

  public async getTransactions(req: Request, res: Response) {
    const result = await this._getTransactionsHandler.handle(req, res);

    if (result.isFailure) {
      return this._apiResponse.BadRequest(res, result.errors);
    }

    return this._apiResponse.Ok(
      res,
      "Transactions fetched successfully",
      result.value
    );
  }
}
