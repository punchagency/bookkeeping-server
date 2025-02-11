import { Router } from "express";
import { inject, injectable } from "tsyringe";
import { ConversationController } from "./controller";
import { useAuth } from "./../../infrastructure/middlewares";

@injectable()
export class ConversationRoute {
  public readonly router: Router;
  private readonly _conversationController: ConversationController;
  constructor(
    @inject(ConversationController)
    conversationController: ConversationController
  ) {
    this.router = Router();
    this._conversationController = conversationController;

    this.registerRoutes();
  }

  private registerRoutes() {
    this.router.post("/", [useAuth], (req, res) =>
      this._conversationController.createConversation(req, res)
    );
  }
}
