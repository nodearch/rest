import { logger, proto, ArchApp } from '@nodearch/core';
import express from 'express';
import * as http from 'http';
import { METADATA_KEY } from './constants';
import { RouteInfo } from './interfaces';
import { HttpMethod } from './enums';
import { validate } from './validation';


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

      const controllerMiddlewares = this.getControllerMiddlewares(ctrlDef);

      ctrlMethods.forEach((ctrlMethod: any) => {
        const routeInfo = this.getMethodRouteInfo(ctrlInstance, ctrlMethod);
        const methodMiddlewares = this.getMethodMiddlewares(ctrlInstance, ctrlMethod);
        const validationSchema = this.getValidationSchema(ctrlInstance, ctrlMethod);

        const middlewares = [...controllerMiddlewares, ...methodMiddlewares];

        if (validationSchema) {
          middlewares.push(validate(validationSchema));
        }

        if (routeInfo) {
          this.routerMapping(routeInfo, middlewares, ctrlInstance[ctrlMethod], ctrlInstance);
        }
      });
    });

    this.expressApp.use(this.router);
  }

  private getMethodRouteInfo (ctrlInstance: any, ctrlMethod: string): RouteInfo {
    return <RouteInfo>Reflect.getMetadata(METADATA_KEY.ARCH_ROUTE_INFO, ctrlInstance, ctrlMethod);
  }

  private getMethodMiddlewares (ctrlInstance: any, ctrlMethod: string): any[] {
    return Reflect.getMetadata(METADATA_KEY.ARCH_MIDDLEWARE, ctrlInstance, ctrlMethod) || [];
  }

  private getControllerMiddlewares (ctrlInstance: any): any[] {
    return Reflect.getMetadata(METADATA_KEY.ARCH_MIDDLEWARE, ctrlInstance) || [];
  }

  private getValidationSchema (ctrlInstance: any, ctrlMethod: string): any[] {
    return Reflect.getMetadata(METADATA_KEY.ARCH_VALIDATION_SCHEMA, ctrlInstance, ctrlMethod);
  }

  private routerMapping(routeInfo: RouteInfo, middlewares: any[], handler: any, ctrlInstance: any) {
    switch (routeInfo.method) {
      case HttpMethod.GET:
        this.router.get(routeInfo.path, middlewares, handler.bind(ctrlInstance));
        break;
      case HttpMethod.POST:
        this.router.post(routeInfo.path, middlewares, handler.bind(ctrlInstance));
        break;
      case HttpMethod.PUT:
        this.router.put(routeInfo.path, middlewares, handler.bind(ctrlInstance));
        break;
      case HttpMethod.DELETE:
        this.router.delete(routeInfo.path, middlewares, handler.bind(ctrlInstance));
        break;
      case HttpMethod.HEAD:
        this.router.head(routeInfo.path, middlewares, handler.bind(ctrlInstance));
        break;
      case HttpMethod.PATCH:
        this.router.patch(routeInfo.path, middlewares, handler.bind(ctrlInstance));
        break;
      case HttpMethod.OPTIONS:
        this.router.options(routeInfo.path, middlewares, handler.bind(ctrlInstance));
        break;
      case HttpMethod.ALL:
        this.router.all(routeInfo.path, middlewares, handler.bind(ctrlInstance));
        break;
      default:
        this.router.all(routeInfo.path, middlewares, handler.bind(ctrlInstance));
    }
  }

  get express() {
    return express;
  }
}
