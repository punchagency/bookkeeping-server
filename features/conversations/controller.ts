import { Request, Response } from "express";
import { inject, injectable } from "tsyringe";

import GetConversationHandler from "./get-conversation/handler";
import ApiResponse from "./../../application/response/response";
import CreateConversationHandler from "./create-conversation/handler";
import { IApiResponse } from "./../../application/response/i-response";
@injectable()
export class ConversationController {
  private readonly _apiResponse: IApiResponse;
  private readonly _getConversationHandler: GetConversationHandler;
  private readonly _createConversationHandler: CreateConversationHandler;

  constructor(
    @inject(ApiResponse) apiResponse: IApiResponse,
    @inject(CreateConversationHandler)
    createConversationHandler: CreateConversationHandler,
    @inject(GetConversationHandler)
    getConversationHandler: GetConversationHandler
  ) {
    this._apiResponse = apiResponse;
    this._getConversationHandler = getConversationHandler;
    this._createConversationHandler = createConversationHandler;
  }

  public async createConversation(req: Request, res: Response) {
    const result = await this._createConversationHandler.handle(req, res);

    if (result.isFailure) {
      return this._apiResponse.BadRequest(res, result.errors);
    }

    return this._apiResponse.Created(res, "Conversation created successfully");
  }

  public async getConversations(req: Request, res: Response) {
    const result = await this._getConversationHandler.handle(req, res);

    if (result.isFailure) {
      return this._apiResponse.BadRequest(res, result.errors);
    }

    return this._apiResponse.Ok(
      res,
      "Conversion fetched successfully",
      result.value
    );
  }
}
