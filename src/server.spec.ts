import { describe, it } from 'mocha';
import { expect } from 'chai';
import { RestServer } from './server';
import { ArchApp, Injectable, Controller, Module } from '@nodearch/core';
import { Get, Post } from './decorators';
import { RegisterRoutes, StartExpress } from './sequence';
import * as http from 'http';

describe('server', () => {

  describe('RestServer', () => {

    @Injectable()
    class Provider1 {
      private readonly param1: string;
      constructor() {
        this.param1 = 'value1';
      }
    }

    @Controller('controller1')
    class Controller1 {

      private readonly s1: Provider1;
      constructor(a: Provider1) {
        this.s1 = a;
      }

      @Get('/')
      public findAll(): string[] {
        return ['data1', 'data2'];
      }

      @Post('/')
      public create(): string {
        return 'data1';
      }
    }

    @Module({
      imports: [],
      controllers: [Controller1],
      providers: [Provider1],
      exports: []
    })
    class Module1 {}

    describe('onInit', () => {
      it('initiate server', async () => {

        const restServer: any = new RestServer({ config: { hostname: 'localhost', port: 3000 }, sequence: { expressSequence: [] } });

        const archApp: any = { logger: { log: true } };
        await restServer.onInit(archApp);

        expect(restServer.logger).to.be.deep.equal({ log: true });

      });
    });

    describe('onStart', () => {
      let restServer: any;

      afterEach(() => {
        restServer.close();
      });

      it('successfully start server', async () => {

        const archApp: ArchApp = new ArchApp([ Module1 ], { logger: { error: () => { }, warn: () => { }, info: () => { }, debug: () => { } } });
        archApp.load();

        restServer = new RestServer({
          config: { hostname: 'localhost', port: 3000 },
          sequence: { expressSequence: [new RegisterRoutes(),  new StartExpress()] }
        });

        await restServer.onInit(archApp);
        await restServer.onStart(archApp);

        expect(restServer.server).to.be.instanceOf(http.Server);

      });

      it('forgot StartExpress', async () => {

        let error = { message: '' };
        const archApp: ArchApp = new ArchApp([ Module1 ], { logger: { error: () => { }, warn: () => { }, info: () => { }, debug: () => { } } });
        archApp.load();

        restServer = new RestServer({
          config: { hostname: 'localhost', port: 3000 },
          sequence: { expressSequence: [new RegisterRoutes()] }
        });

        await restServer.onInit(archApp);

        try {
          await restServer.onStart(archApp);

        } catch (err) {
          error = err;
        }

        expect(error).to.be.instanceOf(Error);
        expect(error.message).to.be.equal('forgot to call >> new StartExpress() in RestServer Sequence');

      });

      it('forgot RegisterRoutes', async () => {

        let error = { message: '' };
        const archApp: ArchApp = new ArchApp([ Module1 ], { logger: { error: () => { }, warn: () => { }, info: () => { }, debug: () => { } } });
        archApp.load();

        restServer = new RestServer({
          config: { hostname: 'localhost', port: 3000 },
          sequence: { expressSequence: [new StartExpress()] }
        });

        await restServer.onInit(archApp);

        try {
          await restServer.onStart(archApp);

        } catch (err) {
          error = err;
        }

        expect(error).to.be.instanceOf(Error);
        expect(error.message).to.be.equal('forgot to call >> new RegisterRoutes() in RestServer Sequence');

      });
    });

  });

});
