import { container } from "tsyringe";

import BankRoute from "./route";
import BankController from "./controller";
import CurrentBankHandler from "./current/handler";
import ConnectBankService from "./connect-bank/service";
import ConnectBankHandler from "./connect-bank/handler";
import GetTransactionsHandler from "./get-transactions/handler";

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

  container.register(CurrentBankHandler.name, {
    useClass: CurrentBankHandler,
  });

  container.register(GetTransactionsHandler.name, {
    useClass: GetTransactionsHandler,
  });
};
