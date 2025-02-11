import { IRepository } from "../i-repository";
import { Conversation } from "../../../domain/entities/conversations";

export interface IConversationRepository extends IRepository<Conversation> {
  findConversationByUserId(userId: string): Promise<Conversation[] | null>;
}
