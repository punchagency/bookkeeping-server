import { registerMxClientDi } from "../packages/mx/di";
import { registerAiDi } from "../../../features/ai/di";
import { registerBaseDi } from "../../../features/base/di";
import { registerBankDi } from "../../../features/bank/di";
import { registerAuthDi } from "../../../features/auth/di/di";
import { registerOpenAiClientDi } from "../packages/openai/di";
import { registerMxUserDi } from "../../../features/mx-user/di";
import { registerEnvConfigDi } from "./../../../utils/env-config";
import { registerSendgridServiceDi } from "../packages/sendgrid/di";
import { registerAuthTokenUtilsDi } from "../../../utils/auth-token";
import { registerUserRepositoryDi } from "../../repositories/user/di";
import { registerSettingsDi } from "./../../../features/settings/di/di";
import { registerTokenRepositoryDi } from "../../repositories/token/di";
import { registerApiResponseDi } from "../../../application/response/di";
import { registerSettingsRepositoryDi } from "../../repositories/settings/di";
import { registerConversationsDi } from "../../../features/conversations/di";
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
    registerSettingsDi();
    registerConversationsDi();

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
    registerSettingsRepositoryDi();
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
