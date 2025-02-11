import { Request, Response } from "express";
import { injectable, inject } from "tsyringe";
import { v4 as uuidv4 } from "uuid";

import { User } from "../../../domain/entities/user";
import { Result } from "./../../../application/result";
import { createConversationSchema, IMessage } from "./create-conversation.dto";
import ConversationRepository from "./../../../infrastructure/repositories/conversations/token-repository";
import { IConversationRepository } from "./../../../infrastructure/repositories/conversations/i-conversation-repository";

@injectable()
export default class CreateConversationHandler {
  private readonly _conversationRepository: IConversationRepository;

  constructor(
    @inject(ConversationRepository)
    conversationRepository: IConversationRepository
  ) {
    this._conversationRepository = conversationRepository;
  }

  public async handle(req: Request, res: Response) {
    const values = await createConversationSchema.validateAsync(req.body);
    const currentUser = req.user as User;

    const conversationTitle = `conv_${uuidv4()}`;

    await this._conversationRepository.create({
      userId: currentUser._id.toString(),
      messages: values.meessage as IMessage[],
      title: conversationTitle,
      isActive: true,
    });

    return Result.Ok();
  }
}
