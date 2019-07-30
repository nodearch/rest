import { proto, ArchApp, ILogger, AppExtension, IArchApp } from '@nodearch/core';
import express from 'express';
import * as http from 'http';
import { METADATA_KEY } from './constants';
import { RouteInfo, IConnection } from './interfaces';
import { HttpMethod } from './enums';
import { validate } from './validation';
import { ValidationStrategy } from './types/validation-strategy';
import { Logger } from './logger';
import { ExpressSequence, StartExpress, ExpressMiddleware, RegisterRoutes } from './sequence';



export class RestServer implements AppExtension {

  private port: number;
  private hostname: string;
  private server: http.Server;
  private router: express.Router;
  private validationStrategy?: ValidationStrategy;
  public expressApp: express.Application;
  private logger: ILogger;
  private expressSequence: ExpressSequence[];

  constructor(connectionOptions: IConnection, expressSequence: ExpressSequence[]) {
    this.port = connectionOptions.port;
    this.hostname = connectionOptions.hostname || 'localhost';
    this.logger = new Logger();
    this.expressSequence = expressSequence;

    this.expressApp = express();
    this.router = express.Router();
    this.server = http.createServer(this.expressApp);
  }

  async onInit(archApp: IArchApp) {
    this.logger = archApp.logger;
  }

  async onStart(archApp: IArchApp) {

    const eRegisterRoutesIndex = this.getRegisterRoutesIndex();
    const eStartIndex = this.getStartExpressIndex();

    this.registerSequenceMiddlewares(this.expressSequence.slice(0, eRegisterRoutesIndex));

    const controllers = archApp.getControllers();
    this.registerRoutes(controllers);

    this.registerSequenceMiddlewares(this.expressSequence.slice(eRegisterRoutesIndex + 1, eStartIndex));

    await this.start();
  }

  private getRegisterRoutesIndex() {
    const eRegisterRoutesIndex = this.expressSequence.findIndex((x: ExpressSequence) => x instanceof RegisterRoutes);
    if (eRegisterRoutesIndex > -1) {
      return eRegisterRoutesIndex;
    }
    else {
      throw new Error('forgot to call >> new RegisterRoutes() in RestServer Sequence');
    }
  }

  private getStartExpressIndex() {
    const eStartIndex = this.expressSequence.findIndex((x: ExpressSequence) => x instanceof StartExpress);
    if (eStartIndex > -1) {
      return eStartIndex;
    }
    else {
      throw new Error('forgot to call >> new StartExpress() in RestServer Sequence');
    }
  }

  private registerSequenceMiddlewares(expressSequence: ExpressSequence[]) {
    expressSequence.forEach((seqItem: ExpressSequence) => {
      if (seqItem instanceof ExpressMiddleware) {
        this.expressApp.use(...seqItem.args);
      }
    });
  }

  async start(): Promise<void> {
    return new Promise((resolve, reject) => {

      this.server.listen(this.port, this.hostname);

      this.server.on('error', (err) => {
        reject(err);
      });

      this.server.on('listening', () => {
        this.logger.info(`Server running at: ${this.hostname}:${this.port}`);
        resolve();
      });
    });
  }

  close(): void {
    this.server.close();
  }

  public registerRoutes(controllers: Map<any, any>) {
    controllers.forEach((ctrlInstance: any, ctrlDef: Function) => {
      const ctrlMethods = proto.getMethods(ctrlDef);

      const controllerMiddlewares = this.getControllerMiddlewares(ctrlDef);
      const controllerPrefix = this.getControllerPrefix(ctrlDef);
      let routePrefix: string;

      if (controllerPrefix) {
        routePrefix = this.getRoutePrefix(controllerPrefix);
      }

      ctrlMethods.forEach((ctrlMethod: any) => {
        const routeInfo = this.getMethodRouteInfo(ctrlInstance, ctrlMethod);

        if (routePrefix) {
          routeInfo.path = routePrefix + routeInfo.path;
        }

        const methodMiddlewares = this.getMethodMiddlewares(ctrlInstance, ctrlMethod);
        const validationSchema = this.getValidationSchema(ctrlInstance, ctrlMethod);

        const middlewares = [...controllerMiddlewares, ...methodMiddlewares];

        if (validationSchema) {
          if (this.validationStrategy) {
            middlewares.push(validate(this.validationStrategy, validationSchema));
          }
          else {
            throw new Error('cannot use @Validate without defining Validation Strategy!');
          }
        }

        if (routeInfo) {
          this.routerMapping(routeInfo, middlewares, ctrlInstance[ctrlMethod], ctrlInstance);
          this.logger.info(`Register HTTP Route - ${routeInfo.method} ${routeInfo.path}`)
        }
      });
    });

    this.expressApp.use(this.router);
  }

  private getMethodRouteInfo(ctrlInstance: any, ctrlMethod: string): RouteInfo {
    return <RouteInfo>Reflect.getMetadata(METADATA_KEY.ARCH_ROUTE_INFO, ctrlInstance, ctrlMethod);
  }

  private getMethodMiddlewares(ctrlInstance: any, ctrlMethod: string): any[] {
    return Reflect.getMetadata(METADATA_KEY.ARCH_MIDDLEWARE, ctrlInstance, ctrlMethod) || [];
  }

  private getControllerMiddlewares(ctrlInstance: any): any[] {
    return Reflect.getMetadata(METADATA_KEY.ARCH_MIDDLEWARE, ctrlInstance) || [];
  }

  private getControllerPrefix(ctrlInstance: any): string | undefined {
    return Reflect.getMetadata(METADATA_KEY.ARCH_CONTROLLER_PREFIX, ctrlInstance);
  }

  private getValidationSchema(ctrlInstance: any, ctrlMethod: string): any[] {
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

  private getRoutePrefix(controllerPrefix: string): string {
    let routePrefix;

    if (controllerPrefix.charAt(controllerPrefix.length - 1) === '/') {
      routePrefix = controllerPrefix.slice(0, controllerPrefix.length - 1);
    }
    else {
      routePrefix = controllerPrefix;
    }

    routePrefix = routePrefix.charAt(0) === '/' ? routePrefix : '/' + routePrefix;

    return routePrefix;
  }
}