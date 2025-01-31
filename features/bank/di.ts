import { container } from "tsyringe";

import BankRoute from "./route";
import BankController from "./controller";
import ConnectBankService from "./connect-bank/service";
import ConnectBankHandler from "./connect-bank/handler";

export const registerBankDi = () => {
  container.register(BankController.name, {
    useClass: BankController,
  });

  container.register(BankRoute.name, {
    useClass: BankRoute,
  });

  container.register(ConnectBankService.name, {
    useClass: ConnectBankService,
  });

  container.register(ConnectBankHandler.name, {
    useClass: ConnectBankHandler,
  });
};
