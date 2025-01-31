import { Router } from "express";
import { inject, injectable } from "tsyringe";

import BankController from "./controller";
import { useAuth } from "./../../infrastructure/middlewares";

@injectable()
export default class BankRoute {
  public readonly router: Router;
  private readonly _bankController: BankController;

  constructor(@inject(BankController.name) bankController: BankController) {
    this.router = Router();
    this._bankController = bankController;

    this.registerRoutes();
  }

  private registerRoutes() {
    this.router.post("/connect", [useAuth], (req, res) =>
      this._bankController.connectBank(req, res)
    );

    this.router.get("/", (req, res) =>
      this._bankController.getConnectedBanks(req, res)
    );

    this.router.delete("/:id", (req, res) =>
      this._bankController.disconnectBank(req, res)
    );
  }
}
