import { logger } from '@nodearch/core';
import express from 'express';
import * as http from 'http';


export class RestServer {

  private port: number;
  private hostname?: string;
  private server: http.Server;
  private expressApp: express.Application;

  constructor(port: number, hostname?: string) {
    this.port = port;
    this.hostname = hostname;

    this.expressApp = express();
    this.server = http.createServer(this.expressApp);

    this.expressApp.all('/', (req, res) => {
      res.status(200).json({ message: 'Hello, World!' });
    });
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
}
