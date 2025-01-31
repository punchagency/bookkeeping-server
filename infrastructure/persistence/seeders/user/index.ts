import "reflect-metadata";
import bcrypt from "bcrypt";
import { container } from "tsyringe";
import { User } from "../../../../domain/entities/user";
import { UserRepository } from "../../../repositories/user/user-repository";
import {
  EnvConfiguration,
  logger,
  connectToDatabase,
  disconnectFromDatabase,
} from "../../../../utils";
import GlobalDIConfig from "../../../config/di/global-di-config";

GlobalDIConfig.registerAllServices();

export const seedDeveloperUser = async () => {
  try {
    const userRepository = container.resolve(UserRepository);
    const envConfig = container.resolve(EnvConfiguration);

    const seededAccountEmail = envConfig.SEEDED_ACCOUNT_EMAIL;
    const seededAccountPassword = envConfig.SEEDED_ACCOUNT_PASSWORD;

    const existingUser = await userRepository.findByEmail(seededAccountEmail);

    if (existingUser) {
      logger("Developer user already exists, skipping seeder...");
      return;
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(seededAccountPassword, saltRounds);

    const developerUser: Partial<User> = {
      email: seededAccountEmail,
      fullName: "Developer Account",
      password: hashedPassword,
    };

    const createdUser = await userRepository.create(developerUser as User);
    logger(`Developer user created successfully: ${createdUser.email}`);
  } catch (error) {
    logger("Error seeding developer user:", error);
    throw error;
  }
};

if (require.main === module) {
  connectToDatabase();
  seedDeveloperUser()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      disconnectFromDatabase();
      process.exit(1);
    });
}
