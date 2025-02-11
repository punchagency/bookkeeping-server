import { injectable } from "tsyringe";
import {
  ConversationModel,
  Conversation,
} from "../../../domain/entities/conversations";
import { IConversationRepository } from "./i-conversation-repository";
import { Repository } from "../repository";

@injectable()
export default class ConversationRepository
  extends Repository<Conversation>
  implements IConversationRepository
{
  constructor() {
    super(ConversationModel);
  }

  async findConversationByUserId(userId: string): Promise<Conversation | null> {
    return await ConversationModel.findOne({
      userId,
    });
  }
}
