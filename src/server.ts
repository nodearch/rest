import { Logger, IAppExtension, ArchApp, ControllerInfo, createExtension } from '@nodearch/core';
import express from 'express';
import * as http from 'http';
import { ExpressSequence, StartExpress, ExpressMiddleware, RegisterRoutes } from './sequence';
import { IServerConfig, IServerOptions } from './interfaces';
import { RestControllerInfo } from './controller';
import { HttpErrorsRegistry } from './errors/errors-registry';

class RestServer implements IAppExtension {

  private server: http.Server;
  private logger: Logger;
  private expressSequence: ExpressSequence[];
  private httpErrorsRegistry: HttpErrorsRegistry;

  controllers: RestControllerInfo[];
  options: IServerOptions;
  config: IServerConfig;
  expressApp: express.Application;


  constructor(archApp: ArchApp, options: IServerOptions) {
    this.logger = archApp.loggerFactory.getLogger('Rest');
    this.options = options;
    this.config = this.options.config;
    this.expressSequence = this.options.sequence.expressSequence;
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
    const eRegisterRoutesIndex = this.getRegisterRoutesIndex();
    const eStartIndex = this.getStartExpressIndex();

    this.registerSequenceMiddlewares(this.expressSequence.slice(0, eRegisterRoutesIndex));

    controllers.forEach(ctrl => {
      const restCtrl = new RestControllerInfo(ctrl, this.httpErrorsRegistry, this.config, this.logger);
      this.expressApp.use(restCtrl.router);
      this.controllers.push(restCtrl);
    });

    this.registerSequenceMiddlewares(this.expressSequence.slice(eRegisterRoutesIndex + 1, eStartIndex));
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
