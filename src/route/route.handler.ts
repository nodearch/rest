import { ControllerInfo, IControllerMethod } from '@nodearch/core';
import { RouteInfo } from './route.info';
import { getGuardsMiddleware } from '../auth';
import * as metadata from '../metadata';
import { IRouteHandlerOptions } from './handler-options.interface';
import { getValidationMiddleware, IValidationSchema } from '../validation';
import { getFileUploadMiddleware } from '../fileUpload';

export class RouteHandler {

  private controllers: ControllerInfo[];
  private options: IRouteHandlerOptions;

  constructor(controllers: ControllerInfo[], options?: IRouteHandlerOptions) {
    this.controllers = controllers;
    this.options = options || {};
  }

  getRoutes(): RouteInfo[] {
    const routes: RouteInfo[] = [];

    this.controllers.forEach((controllerInfo: ControllerInfo) => {
      routes.push(...this.getControllerRouteInfo(controllerInfo));
    });

    return routes;
  }

  private getControllerRouteInfo(controllerInfo: ControllerInfo): RouteInfo[] {
    const routesInfo: RouteInfo[] = [];

    const controllerPrefix = controllerInfo.prefix;
    const routePrefix = this.getRoutePrefix(controllerPrefix);
    const controllerGuards = getGuardsMiddleware(controllerInfo.guards);
    const controllerMiddlewares = metadata.controller.getControllerMiddlewares(controllerInfo.classDef);

    controllerInfo.methods.forEach((methodInfo: IControllerMethod) => {
      const controllerMethodGuards = getGuardsMiddleware(methodInfo.guards);
      const controllerMethodMiddlewares = metadata.controller.getControllerMethodMiddlewares(controllerInfo.classInstance, methodInfo.name);
      const httpMethod = metadata.controller.getMethodHTTPMethod(controllerInfo.classInstance, methodInfo.name);
      const httpPath = metadata.controller.getMethodHTTPPath(controllerInfo.classInstance, methodInfo.name);
      const fullHttpPath = routePrefix ? routePrefix + httpPath : httpPath;

      const validationSchema: IValidationSchema = metadata.controller.getMethodValidationSchema(controllerInfo.classInstance, methodInfo.name);
      const fileUpload = metadata.controller.getMethodFileUpload(controllerInfo.classInstance, methodInfo.name);

      let validationMiddleware, fileUploadMiddleware;

      if (validationSchema) {
        validationMiddleware = getValidationMiddleware(validationSchema, this.options.joiValidationOptions);
      }

      if (fileUpload) {
        fileUploadMiddleware = getFileUploadMiddleware(fileUpload, this.options.fileUploadOptions);
      }

      routesInfo.push(
        new RouteInfo(
          httpMethod,
          fullHttpPath,
          controllerInfo.classInstance[methodInfo.name].bind(controllerInfo.classInstance),
          controllerMiddlewares,
          controllerMethodMiddlewares,
          controllerGuards,
          controllerMethodGuards,
          validationMiddleware,
          fileUploadMiddleware
        )
      );
    });

    return routesInfo;
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
