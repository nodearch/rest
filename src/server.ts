import { ILogger, IAppExtension, IArchApp, ControllerInfo } from '@nodearch/core';
import express from 'express';
import * as http from 'http';
import { HttpMethod } from './enums';
import { Sequence, ExpressSequence, StartExpress, ExpressMiddleware, RegisterRoutes } from './sequence';
import Joi from '@hapi/joi';
import { RouteHandler, RouteInfo } from './route';

export class RestServer implements IAppExtension {

  private server: http.Server;
  private router: express.Router;
  public expressApp: express.Application;
  private logger?: ILogger;
  private expressSequence: ExpressSequence[];
  private port: number;
  private hostname: string;
  private joiValidationOptions?: Joi.ValidationOptions;

  constructor(options: { config: { port: number, hostname: string, joiValidationOptions?: Joi.ValidationOptions }, sequence: Sequence }) {
    this.expressSequence = options.sequence.expressSequence;
    this.port = options.config.port;
    this.hostname = options.config.hostname;
    this.joiValidationOptions = options.config.joiValidationOptions;

    this.expressApp = express();
    this.router = express.Router();
    this.server = http.createServer(this.expressApp);
  }

  async onInit(archApp: IArchApp) {
    this.logger = archApp.logger;
  }

  async onStart(archApp: IArchApp) {
    const controllers: ControllerInfo[] = archApp.getControllers();
    await this.init(controllers);
  }

  public async init(controllers: ControllerInfo[]) {
    const eRegisterRoutesIndex = this.getRegisterRoutesIndex();
    const eStartIndex = this.getStartExpressIndex();

    this.registerSequenceMiddlewares(this.expressSequence.slice(0, eRegisterRoutesIndex));

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

        if (this.logger) {
          this.logger.info(`Server running at: ${this.hostname}:${this.port}`);
        }

        resolve();
      });
    });
  }

  close(): void {
    this.server.close();
  }

  public registerRoutes(controllers: ControllerInfo[]) {
  
    const routeHandler = new RouteHandler(controllers, { joiValidationOptions: this.joiValidationOptions });

    const routes: RouteInfo[] = routeHandler.getRoutes();

    routes.forEach((routeInfo: RouteInfo) => {
      
      this.routerMapping(routeInfo);

      if (this.logger) {
        this.logger.info(`Register HTTP Route - ${routeInfo.method} ${routeInfo.path}`);
      }

    });

    this.expressApp.use(this.router);
  }

  private routerMapping(routeInfo: RouteInfo) {
    switch (routeInfo.method) {
      case HttpMethod.GET:
        this.router.get(routeInfo.path, routeInfo.middlewares);
        break;
      case HttpMethod.POST:
        this.router.post(routeInfo.path, routeInfo.middlewares);
        break;
      case HttpMethod.PUT:
        this.router.put(routeInfo.path, routeInfo.middlewares);
        break;
      case HttpMethod.DELETE:
        this.router.delete(routeInfo.path, routeInfo.middlewares);
        break;
      case HttpMethod.HEAD:
        this.router.head(routeInfo.path, routeInfo.middlewares);
        break;
      case HttpMethod.PATCH:
        this.router.patch(routeInfo.path, routeInfo.middlewares);
        break;
      case HttpMethod.OPTIONS:
        this.router.options(routeInfo.path, routeInfo.middlewares);
        break;
      case HttpMethod.ALL:
        this.router.all(routeInfo.path, routeInfo.middlewares);
        break;
      default:
        this.router.all(routeInfo.path, routeInfo.middlewares);
    }
  }
}