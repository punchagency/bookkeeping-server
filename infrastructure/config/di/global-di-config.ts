import { registerMxClientDi } from "../packages/mx/di";
import { registerBaseDi } from "../../../features/base/di";
import { registerAuthDi } from "../../../features/auth/di";
import { registerBankDi } from "../../../features/bank/di";
import { registerMxUserDi } from "../../../features/mx-user/di";
import { registerEnvConfigDi } from "./../../../utils/env-config";
import { registerAuthTokenUtilsDi } from "../../../utils/auth-token";
import { registerUserRepositoryDi } from "../../repositories/user/di";
import { registerTokenRepositoryDi } from "../../repositories/token/di";
import { registerApiResponseDi } from "../../../application/response/di";
import { registerTransactionRepositoryDi } from "../../repositories/transaction/di";

export default class GlobalDIConfig {
  public static registerAllServices() {
    registerEnvConfigDi();
    registerMxClientDi();
    registerApiResponseDi();
    registerBaseDi();
    registerAuthDi();
    registerBankDi();
    registerMxUserDi();
    registerTokenRepositoryDi();
    registerUserRepositoryDi();
    registerAuthTokenUtilsDi();
    registerTransactionRepositoryDi();
  }
}
