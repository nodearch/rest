import { ControllerInfo, IControllerMethod, ILogger } from '@nodearch/core';
import * as metadata from '../metadata';
import { getValidationMiddleware } from '../validation';
import { getFileUploadMiddleware } from '../fileUpload';
import express from 'express';
import { IServerConfig } from '../interfaces';


export class RestControllerInfo {

  private serverConfig: IServerConfig;
  private logger: ILogger;
  controllerInfo: ControllerInfo;
  router: express.Router;

  constructor(controllerInfo: ControllerInfo, serverConfig: IServerConfig, logger: ILogger) {
    this.controllerInfo = controllerInfo;
    this.serverConfig = serverConfig;
    this.logger = logger;
    this.router = express.Router();
    this.registerRoutes();
  }

  private registerRoutes() {
    const controllerPrefix = this.controllerInfo.prefix;
    const routePrefix = this.getRoutePrefix(controllerPrefix);

    const controllerMiddlewares = metadata.controller.getControllerMiddlewares(this.controllerInfo.classDef);

    this.controllerInfo.methods.forEach((methodInfo: IControllerMethod) => {
      const middlewares = [];

      const controllerMethodMiddlewares = metadata.controller.getControllerMethodMiddlewares(this.controllerInfo.classInstance, methodInfo.name);
      const httpMethod = metadata.controller.getMethodHTTPMethod(this.controllerInfo.classInstance, methodInfo.name);
      const httpPath = metadata.controller.getMethodHTTPPath(this.controllerInfo.classInstance, methodInfo.name);
      const fullHttpPath = routePrefix ? routePrefix + httpPath : httpPath;

      const fileUploadMiddleware = getFileUploadMiddleware(this.controllerInfo, methodInfo, this.serverConfig.fileUploadOptions);
      const validationSchemaMiddleware = getValidationMiddleware(this.controllerInfo, methodInfo, this.serverConfig.joiValidationOptions);

      // add Guards
      if (methodInfo.execGuards) {
        middlewares.push(this.guardMiddlewareFactory(methodInfo));
      }

      // add fileUpload
      if (fileUploadMiddleware) {
        middlewares.push(fileUploadMiddleware);
      }

      // Add Controller Middlewares then method Middlewares
      middlewares.push(...controllerMiddlewares);
      middlewares.push(...controllerMethodMiddlewares);

      // Add Validation Middleware
      if (validationSchemaMiddleware) {
        middlewares.push(validationSchemaMiddleware);
      }

      // Add route handler
      middlewares.push(
        this.controllerInfo.classInstance[methodInfo.name]
          .bind(this.controllerInfo.classInstance)
      );

      // register route
      this.router[httpMethod](fullHttpPath, middlewares);

      this.logger.info(`Register HTTP Route - ${httpMethod.toUpperCase()} ${fullHttpPath}`);
    });
  }

  private getRoutePrefix(controllerPrefix?: string): string | undefined {
    if (controllerPrefix) {
      let routePrefix;

      if (controllerPrefix.charAt(controllerPrefix.length - 1) === '/') {
        routePrefix = controllerPrefix.slice(0, controllerPrefix.length - 1);
      }
      else {
        routePrefix = controllerPrefix;
      }

      return routePrefix.charAt(0) === '/' ? routePrefix : '/' + routePrefix;
    }
  }

  private guardMiddlewareFactory(methodInfo: IControllerMethod) {
    return (req: express.Request, res: express.Response, next: express.NextFunction) => {
      if (!methodInfo.execGuards) return next();

      let guardsResult = false;

      methodInfo
        .execGuards(req, res)
        .then((execResult: boolean) => {
          guardsResult = execResult;
        })
        .catch((execError) => {
          this.logger.error(`Error was thrown in a Guard on the method ${methodInfo.name}`, execError);
        })
        .finally(() => {
          if (guardsResult) {
            next();
          }
          else if (!res.headersSent) {
            this.logger.warn(`a Guard on the method ${methodInfo.name} is terminating the request without a proper Response handling, it will be handled as a 500 Error for now, but you should consider using res.status(xxx).json(...)!`);
            res.status(500).end();
          }
        });
    };
  }
}