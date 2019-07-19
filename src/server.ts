import { logger, proto, ArchApp } from '@nodearch/core';
import express from 'express';
import * as http from 'http';
import { METADATA_KEY } from './constants';
import { RouteInfo } from './interfaces';
import { HttpMethod } from './enums';


export class RestServer {

  private port: number;
  private hostname?: string;
  private server: http.Server;
  public expressApp: express.Application;
  private archApp: ArchApp;
  private router: express.Router;

  constructor(archApp: ArchApp, port: number, hostname?: string) {
    this.port = port;
    this.hostname = hostname;
    this.archApp = archApp;

    this.expressApp = express();
    this.router = express.Router();
    this.server = http.createServer(this.expressApp);
  }

  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server.listen(this.port);

      this.server.on('error', (err) => {
        reject(err);
      });

      this.server.on('listening', () => {
        logger.info(`Server running at: http://${this.hostname || 'localhost'}:${this.port}`);
        resolve();
      });
    });
  }

  public registerRoutes () {
    const controllers = this.archApp.getControllers();

    controllers.forEach((ctrlInstance: any, ctrlDef: Function) => {
      const ctrlMethods = proto.getMethods(ctrlDef);

      ctrlMethods.forEach((ctrlMethod: any) => {
        const routeInfo = this.getMethodRouteInfo(ctrlInstance, ctrlMethod);
        if (routeInfo) {
          this.routerMapping(routeInfo, ctrlInstance[ctrlMethod]);
        }
      });
    });

    this.expressApp.use(this.router);
  }

  private getMethodRouteInfo (ctrlInstance: any, ctrlMethod: string): RouteInfo {
    return <RouteInfo>Reflect.getMetadata(METADATA_KEY.ARCH_ROUTE_INFO, ctrlInstance, ctrlMethod);
  }

  private routerMapping(routeInfo: RouteInfo, handler: any) {
    switch (routeInfo.method) {
      case HttpMethod.GET:
        this.router.get(routeInfo.path, handler);
        break;
      case HttpMethod.POST:
        this.router.post(routeInfo.path, handler);
        break;
      case HttpMethod.PUT:
        this.router.put(routeInfo.path, handler);
        break;
      case HttpMethod.DELETE:
        this.router.delete(routeInfo.path, handler);
        break;
      case HttpMethod.HEAD:
        this.router.head(routeInfo.path, handler);
        break;
      case HttpMethod.PATCH:
        this.router.patch(routeInfo.path, handler);
        break;
      case HttpMethod.OPTIONS:
        this.router.options(routeInfo.path, handler);
        break;
      case HttpMethod.ALL:
        this.router.all(routeInfo.path, handler);
        break;
      default:
        this.router.all(routeInfo.path, handler);
    }
  }

  get express() {
    return express;
  }
}
