import { ControllerInfo, IControllerMethod, ILogger } from '@nodearch/core';
import * as metadata from '../metadata';
import express from 'express';
import { IServerConfig } from '../interfaces';
import { RestCtrlMethod } from './rest-ctrl-method';

export class RestControllerInfo {

  private serverConfig: IServerConfig;
  private logger: ILogger;
  controllerInfo: ControllerInfo;
  router: express.Router;
  methods: RestCtrlMethod[];

  constructor(controllerInfo: ControllerInfo, serverConfig: IServerConfig, logger: ILogger) {
    this.controllerInfo = controllerInfo;
    this.serverConfig = serverConfig;
    this.logger = logger;
    this.methods = [];
    this.router = express.Router();
    this.registerRoutes();
  }

  private registerRoutes() {
    const controllerPrefix = this.controllerInfo.prefix;
    const routePrefix = this.getRoutePrefix(controllerPrefix);

    const controllerMiddlewares = metadata.controller.getControllerMiddlewares(this.controllerInfo.classDef);

    this.controllerInfo.methods.forEach((methodInfo: IControllerMethod) => {
      const restCtrlMethod = new RestCtrlMethod(this.controllerInfo, methodInfo, controllerMiddlewares, this.serverConfig, this.logger, routePrefix);

      this.methods.push(restCtrlMethod);

      // register route
      this.router[restCtrlMethod.httpMethod](restCtrlMethod.httpPath, restCtrlMethod.middlewares);

      this.logger.info(`Register HTTP Route - ${restCtrlMethod.httpMethod.toUpperCase()} ${restCtrlMethod.httpPath}`);
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
