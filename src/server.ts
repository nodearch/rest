import { Logger, IAppExtension, ArchApp, ControllerInfo, createExtension } from '@nodearch/core';
import express from 'express';
import http from 'http';
import { IServerConfig, IServerOptions } from './interfaces';
import { RestControllerInfo } from './controller';
import { HttpErrorsRegistry } from './errors/errors-registry';

class RestServer implements IAppExtension {

  private server: http.Server;
  private logger: Logger;
  private expressMiddlewares: express.RequestHandler[];
  private httpErrorsRegistry: HttpErrorsRegistry;

  controllers: RestControllerInfo[];
  options: IServerOptions;
  config: IServerConfig;
  expressApp: express.Application;

  constructor(archApp: ArchApp, options: IServerOptions) {
    this.logger = archApp.loggerFactory.getLogger('Rest');
    this.options = options;
    this.config = this.options.config;
    this.expressMiddlewares = this.options.middlewares;
    this.httpErrorsRegistry = new HttpErrorsRegistry(this.config.httpErrorsOptions);
    this.controllers = [];

    this.expressApp = express();
    this.server = http.createServer(this.expressApp);
  }

  async onInit(archApp: ArchApp) {
    // this.logger = archApp.loggerFactory.getLogger('Rest');
  }

  async onLoad(archApp: ArchApp) {
    await this.init(archApp);
  }

  async onStart(archApp: ArchApp) {
    await this.start();
  }

  private async init(archApp: ArchApp) {
    const controllers: ControllerInfo[] = archApp.getControllers();
    this.registerMiddlewares();

    controllers.forEach(ctrl => {
      const restCtrl = new RestControllerInfo(ctrl, this.httpErrorsRegistry, this.config, this.logger);
      this.expressApp.use(restCtrl.router);
      this.controllers.push(restCtrl);
    });
  }

  private registerMiddlewares() {
    this.expressMiddlewares.forEach((middleware: express.RequestHandler) => {
      if (middleware instanceof Function) {
        this.expressApp.use(middleware);
      }
    });

    if (this.config.json?.enable) {
      this.expressApp.use(express.json(this.config.json.options));
    }

    if (this.config.urlencoded?.enable) {
      this.expressApp.use(express.urlencoded(this.config.urlencoded.options));
    }

    if (this.config.static) {
      this.expressApp.use(express.static(this.config.static.path, this.config.static.options));
    }
  }

  async start(): Promise<void> {
    return new Promise((resolve, reject) => {

      this.server.listen(this.config.port, this.config.hostname);

      this.server.on('error', (err) => {
        reject(err);
      });

      this.server.on('listening', () => {
        this.logger.info(`Server running at: ${this.config.hostname}:${this.config.port}`);
        resolve();
      });
    });
  }

  close(): void {
    this.server.close();
  }
}

export const restServer = createExtension<IServerOptions>(RestServer);
