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

      if (fileUploadMiddleware) {
        middlewares.push(fileUploadMiddleware);
      }

      middlewares.push(...controllerMiddlewares);
      middlewares.push(...controllerMethodMiddlewares);

      if (validationSchemaMiddleware) {
        middlewares.push(validationSchemaMiddleware);
      }

      middlewares.push(
        this.controllerInfo.classInstance[methodInfo.name]
          .bind(this.controllerInfo.classInstance)
      );

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
}