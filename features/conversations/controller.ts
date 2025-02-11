import { Request, Response } from "express";
import { inject, injectable } from "tsyringe";
import CreateConversationHandler from "./create-conversation/handler";
import { IApiResponse } from "./../../application/response/i-response";
import ApiResponse from "./../../application/response/response";

@injectable()
export class ConversationController {
  private readonly _apiResponse: IApiResponse;
  private readonly _createConversationHandler: CreateConversationHandler;
  constructor(
    @inject(CreateConversationHandler)
    createConversationHandler: CreateConversationHandler,
    @inject(ApiResponse) apiResponse: IApiResponse
  ) {
    this._apiResponse = apiResponse;
    this._createConversationHandler = createConversationHandler;
  }

  public async createConversation(req: Request, res: Response) {
    const result = await this._createConversationHandler.handle(req, res);

    if (result.isFailure) {
      return this._apiResponse.BadRequest(res, result.errors);
    }

    return this._apiResponse.Created(res, "Conversation created successfully");
  }
}
