import dotenv from "dotenv";
import { container, singleton } from "tsyringe";

dotenv.config();
@singleton()
export class EnvConfiguration {
  public readonly IS_PRODUCTION = process.env.NODE_ENV === "production";
  public readonly PORT: number = parseInt(process.env.PORT || "2800", 10);
  public readonly JWT_SECRET = process.env.JWT_SECRET;
  public readonly JWT_ISSUER = process.env.JWT_ISSUER;
  public readonly JWT_AUDIENCE = process.env.JWT_AUDIENCE;
  public readonly JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
  public readonly MX_CLIENT_ID = process.env.MX_CLIENT_ID;
  public readonly MX_API_KEY = process.env.MX_API_KEY;
  public readonly MONGODB_URL = process.env.MONGODB_URL;
  public readonly SEEDED_ACCOUNT_EMAIL = process.env.SEEDED_ACCOUNT_EMAIL;
  public readonly SEEDED_ACCOUNT_PASSWORD = process.env.SEEDED_ACCOUNT_PASSWORD;      
}

export const registerEnvConfigDi = () => {
  container.register(EnvConfiguration.name, { useClass: EnvConfiguration });
};
