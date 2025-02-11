import { container } from "tsyringe";

import { ConversationRoute } from "./route";
import { ConversationController } from "./controller";
import CreateConversationHandler from "./create-conversation/handler";

export const registerConversationsDi = () => {
  container.register<ConversationController>(ConversationController.name, {
    useClass: ConversationController,
  });

  container.register<ConversationRoute>(ConversationRoute.name, {
    useClass: ConversationRoute,
  });

  container.register<CreateConversationHandler>(
    CreateConversationHandler.name,
    {
      useClass: CreateConversationHandler,
    }
  );
};
