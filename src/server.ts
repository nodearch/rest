import { ILogger, IAppExtension, IArchApp, ControllerInfo, Logger } from '@nodearch/core';
import express from 'express';
import * as http from 'http';
import { Sequence, ExpressSequence, StartExpress, ExpressMiddleware, RegisterRoutes } from './sequence';
import { IServerConfig } from './interfaces';
import { RestControllerInfo } from './controller';

export class RestServer implements IAppExtension {

  private server: http.Server;
  private logger: ILogger;
  private expressSequence: ExpressSequence[];
  controllers: RestControllerInfo[];
  config: IServerConfig;
  expressApp: express.Application;


  constructor(options: { config: IServerConfig, sequence: Sequence, logger?: ILogger }) {
    this.controllers = [];
    this.config = options.config;
    this.logger = options.logger ? options.logger : new Logger();
    this.expressSequence = options.sequence.expressSequence;

    this.expressApp = express();
    this.server = http.createServer(this.expressApp);
  }

  async onStart(archApp: IArchApp) {
    const controllers: ControllerInfo[] = archApp.getControllers();
    await this.init(controllers);
  }

  public async init(controllers: ControllerInfo[]) {
    const eRegisterRoutesIndex = this.getRegisterRoutesIndex();
    const eStartIndex = this.getStartExpressIndex();

    this.registerSequenceMiddlewares(this.expressSequence.slice(0, eRegisterRoutesIndex));

    controllers.forEach(ctrl => {
      const restCtrl = new RestControllerInfo(ctrl, this.config, this.logger);
      this.expressApp.use(restCtrl.router);
      this.controllers.push(restCtrl);
    });

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
