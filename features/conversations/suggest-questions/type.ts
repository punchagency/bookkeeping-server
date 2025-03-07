import { Message } from "./../../../domain/entities/conversations";

export interface IPromptConversation
  extends Partial<Omit<Message, "timestamp">> {}

export interface IResultMetadataContext {
  statusCode: number;
}
