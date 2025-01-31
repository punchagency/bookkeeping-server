import { Router } from "express";
import { inject, injectable } from "tsyringe";
import AuthController from "./controller";
import LogoutHandler from "./logout/handler";

@injectable()
export default class AuthRoute {
  public readonly router: Router;
  private readonly _authController: AuthController;

  constructor(@inject(AuthController.name) authController: AuthController) {
    this.router = Router();
    this._authController = authController;

    this.registerRoutes();
  }

  private registerRoutes() {
    this.router.post("/login", (req, res) =>
      this._authController.login(req, res)
    );

    this.router.post("/signup", (req, res) =>
      this._authController.signup(req, res)
    );

    this.router.post("/refresh-token", (req, res) =>
      this._authController.refreshToken(req, res)
    );

    this.router.post("/logout", (req, res) =>
      this._authController.logout(req, res)
    );
  }
}
