import { Request, Response } from "express";
import { inject, injectable } from "tsyringe";

import GetConversationHandler from "./get-conversation/handler";
import ApiResponse from "./../../application/response/response";
import EditConversationHandler from "./edit-conversation/handler";
import CreateConversationHandler from "./create-conversation/handler";
import { IApiResponse } from "./../../application/response/i-response";
@injectable()
export class ConversationController {
  private readonly _apiResponse: IApiResponse;
  private readonly _getConversationHandler: GetConversationHandler;
  private readonly _createConversationHandler: CreateConversationHandler;
  private readonly _editConversationHandler: EditConversationHandler;

  constructor(
    @inject(ApiResponse) apiResponse: IApiResponse,
    @inject(CreateConversationHandler)
    createConversationHandler: CreateConversationHandler,
    @inject(GetConversationHandler)
    getConversationHandler: GetConversationHandler,
    @inject(EditConversationHandler)
    editConversationHandler: EditConversationHandler
  ) {
    this._apiResponse = apiResponse;
    this._getConversationHandler = getConversationHandler;
    this._createConversationHandler = createConversationHandler;
    this._editConversationHandler = editConversationHandler;
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

  public async editConversation(req: Request, res: Response) {
    const result = await this._editConversationHandler.handle(req, res);

    if (result.isFailure) {
      if (result.metadata?.context?.statusCode == 404) {
        return this._apiResponse.NotFound(
          res,
          "Conversation with given id not found",
          result.errors
        );
      } else if (result.metadata?.context.statusCode == 403) {
        return this._apiResponse.Forbidden(
          res,
          "You are not allowed to edit this conversation",
          result.errors
        );
      } else {
        return this._apiResponse.BadRequest(res, result.errors);
      }
    }

    return this._apiResponse.Ok(
      res,
      "Conversation updated successfully",
      result.value
    );
  }
}
