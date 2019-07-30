import { RegisterRoutes } from "./register-routes";
import { ExpressMiddleware } from "./express-middleware";
import { StartExpress } from "./start-express";


export type ExpressSequence = RegisterRoutes | ExpressMiddleware | StartExpress;