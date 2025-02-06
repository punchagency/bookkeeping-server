import { registerMxClientDi } from "../packages/mx/di";
import { registerAiDi } from "../../../features/ai/di";
import { registerBaseDi } from "../../../features/base/di";
import { registerAuthDi } from "../../../features/auth/di";
import { registerBankDi } from "../../../features/bank/di";
import { registerOpenAiClientDi } from "../packages/openai/di";
import { registerMxUserDi } from "../../../features/mx-user/di";
import { registerEnvConfigDi } from "./../../../utils/env-config";
import { registerSendgridServiceDi } from "../packages/sendgrid/di";
import { registerAuthTokenUtilsDi } from "../../../utils/auth-token";
import { registerUserRepositoryDi } from "../../repositories/user/di";
import { registerTokenRepositoryDi } from "../../repositories/token/di";
import { registerApiResponseDi } from "../../../application/response/di";
import { registerTransactionRepositoryDi } from "../../repositories/transaction/di";


export default class GlobalDIConfig {
  public static registerAllServices() {
    /**
     * Application Services || Features
     */
    registerAiDi();
    registerBaseDi();
    registerAuthDi();
    registerBankDi();
    registerMxUserDi();

    /**
     * External Services
     */
    registerOpenAiClientDi();
    registerSendgridServiceDi();
    registerMxClientDi();

    /**
     * Repositories
     */
    registerTokenRepositoryDi();
    registerUserRepositoryDi();
    registerTransactionRepositoryDi();

    /**
     * Utils
     */
    registerAuthTokenUtilsDi();
    registerEnvConfigDi();

    /**
     * Application Behaviors
     */
    registerApiResponseDi();
  }
}
