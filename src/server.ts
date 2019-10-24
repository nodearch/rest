import { ILogger, IAppExtension, IArchApp, ControllerInfo } from '@nodearch/core';
import express from 'express';
import * as http from 'http';
import { Sequence, ExpressSequence, StartExpress, ExpressMiddleware, RegisterRoutes } from './sequence';
import Joi from '@hapi/joi';
import { RouteHandler, RouteInfo } from './route';
import { RouterFactory } from './router';
import { Logger } from './logger';
import { ISwaggerConfig, OpenApiSchema } from './swagger';
import { IServerConfig } from './interfaces';

export class RestServer implements IAppExtension {

  private server: http.Server;
  public expressApp: express.Application;
  private logger: ILogger;
  private expressSequence: ExpressSequence[];
  private port: number;
  private hostname: string;
  private joiValidationOptions?: Joi.ValidationOptions;
  private swagger?: ISwaggerConfig;

  constructor(options: { config: IServerConfig, sequence: Sequence }) {
    this.logger = new Logger();
    this.expressSequence = options.sequence.expressSequence;
    this.port = options.config.port;
    this.hostname = options.config.hostname;
    this.joiValidationOptions = options.config.joiValidationOptions;
    this.swagger = options.config.swagger;
    this.expressApp = express();
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

    if (this.swagger && this.swagger.enable) {
      const swagger = new OpenApiSchema(controllers, this.swagger.options, this.joiValidationOptions);
      await swagger.writeOpenAPI();
      await swagger.register(this.expressApp);
    }

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

  public registerRoutes(controllers: ControllerInfo[]) {

    const routeHandler = new RouteHandler(controllers, { joiValidationOptions: this.joiValidationOptions });
    const routes: RouteInfo[] = routeHandler.getRoutes();
    const routerFactory = new RouterFactory(routes, this.logger);

    this.expressApp.use(routerFactory.router);
  }
}
