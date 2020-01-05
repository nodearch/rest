import { IControllerMethod, ControllerInfo, ILogger } from '@nodearch/core';
import * as metadata from '../metadata';
import { getValidationMiddleware } from '../validation';
import { getFileUploadMiddleware } from '../fileUpload';
import express from 'express';
import { IServerConfig } from '../interfaces';
import { HttpMethod } from '../enums';


export class RestCtrlMethod {

  private controllerInfo: ControllerInfo;
  private methodInfo: IControllerMethod;
  private logger: ILogger;
  private ctrlMiddlewares: express.RequestHandler[];
  private serverConfig: IServerConfig;
  private routePrefix?: string;

  public name: string;
  public middlewares: express.RequestHandler[];
  public httpPath: string;
  public httpMethod: HttpMethod;

  constructor (controllerInfo: ControllerInfo, methodInfo: IControllerMethod, ctrlMiddlewares: express.RequestHandler[], serverConfig: IServerConfig, logger: ILogger, routePrefix?: string) {
    this.name = methodInfo.name;
    this.logger = logger;
    this.controllerInfo = controllerInfo;
    this.methodInfo = methodInfo;
    this.middlewares = [];
    this.ctrlMiddlewares = ctrlMiddlewares;
    this.serverConfig = serverConfig;
    this.routePrefix = routePrefix;

    this.httpMethod = metadata.controller.getMethodHTTPMethod(this.controllerInfo.classInstance, this.methodInfo.name);
    const httpPath = metadata.controller.getMethodHTTPPath(this.controllerInfo.classInstance, this.methodInfo.name);
    this.httpPath = this.routePrefix ? this.routePrefix + httpPath : httpPath;

    this.init();
  }

  private init() {
    const controllerMethodMiddlewares = metadata.controller.getControllerMethodMiddlewares(this.controllerInfo.classInstance, this.methodInfo.name);
    const fileUploadMiddleware = getFileUploadMiddleware(this.controllerInfo, this.methodInfo, this.serverConfig.fileUploadOptions);
    const validationSchemaMiddleware = getValidationMiddleware(this.controllerInfo, this.methodInfo, this.serverConfig.joiValidationOptions);

    // add Guards
    if (this.methodInfo.execGuards) {
      this.middlewares.push(this.guardMiddlewareFactory(this.methodInfo));
    }

    // add fileUpload
    if (fileUploadMiddleware) {
      this.middlewares.push(fileUploadMiddleware);
    }

    // Add Controller Middlewares then method Middlewares
    this.middlewares.push(...this.ctrlMiddlewares);
    this.middlewares.push(...controllerMethodMiddlewares);

    // Add Validation Middleware
    if (validationSchemaMiddleware) {
      this.middlewares.push(validationSchemaMiddleware);
    }

    // Add route handler
    this.middlewares.push(
      this.controllerInfo.classInstance[this.methodInfo.name]
        .bind(this.controllerInfo.classInstance)
    );
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