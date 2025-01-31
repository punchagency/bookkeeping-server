import { container } from "tsyringe";

import AuthRoute from "./route";
import AuthController from "./controller";
import LoginHandler from "./login/handler";
import SignupHandler from "./signup/handler";
import RefreshTokenHandler from "./refresh-token/handler";
import LogoutHandler from "./logout/handler";

export const registerAuthDi = () => {
  container.register(AuthController.name, {
    useClass: AuthController,
  });

  container.register(AuthRoute.name, {
    useClass: AuthRoute,
  });

  container.register(LoginHandler.name, {
    useClass: LoginHandler,
  });

  container.register(SignupHandler.name, {
    useClass: SignupHandler,
  });

  container.register(RefreshTokenHandler.name, {
    useClass: RefreshTokenHandler,
  });

  container.register(LogoutHandler.name, {
    useClass: LogoutHandler,
  });
};
