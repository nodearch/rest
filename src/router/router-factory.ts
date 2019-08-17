import { RouteInfo } from "../route/route.info";
import { Router } from 'express';
import { ILogger } from "@nodearch/core";


export class RouterFactory {

  public router: Router;
  private routesInfo: RouteInfo[];
  private logger: ILogger;

  constructor(routesInfo: RouteInfo[], logger: ILogger) {
    this.routesInfo = routesInfo;
    this.logger = logger;

    this.router = Router();

    this.mapping();
  }

  private mapping() {
    this.routesInfo.forEach((routeInfo: RouteInfo) => {
      this.logger.info(`Register HTTP Route - ${routeInfo.method.toUpperCase()} ${routeInfo.path}`);
      this.router[routeInfo.method](routeInfo.path, routeInfo.middlewares);
    });
  }
}