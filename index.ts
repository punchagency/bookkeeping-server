import "express-async-errors";
import "reflect-metadata";
import Server from "./server";
import { container } from "tsyringe";
import GlobalDIConfig from "./infrastructure/config/di/global-di-config";

GlobalDIConfig.registerAllServices();

const server = container.resolve(Server);

server.start();
