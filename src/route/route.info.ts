import express from 'express';
import { HttpMethod } from '../enums';

export class RouteInfo {
  public method: HttpMethod;
  public path: string;
  public middlewares: express.RequestHandler[];

  constructor(
    method: HttpMethod,
    path: string,
    routeHandlerMethod: any,
    controllerMiddlewares: any[],
    controllerMethodMiddlewares: any[],
    controllerGuards: any[],
    controllerMethodGuards: any[],
    validationMiddleware?: any,
    fileUploadMiddleware?: any
  ) {
    this.method = method;
    this.path = path;
    this.middlewares = [
      ...controllerGuards,
      ...controllerMethodGuards,
      ...controllerMiddlewares,
      ...controllerMethodMiddlewares
    ];

    if (validationMiddleware) {
      this.middlewares.push(validationMiddleware);
    }

    if (fileUploadMiddleware) {
      this.middlewares = [fileUploadMiddleware].concat(this.middlewares);
    }

    this.middlewares.push(routeHandlerMethod);
  }
}
