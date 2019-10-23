import { describe, it } from 'mocha';
import { expect } from 'chai';
import { RestServer } from './server';
import { ArchApp, Injectable, Controller, Module, GuardProvider, Guard } from '@nodearch/core';
import { Get, Post, Validate, Middleware, Put, Head, Patch, Delete, Options } from './decorators';
import { RegisterRoutes, StartExpress, ExpressMiddleware, Sequence } from './sequence';
import * as http from 'http';
import * as Joi from '@hapi/joi';
import { AuthGuard } from './auth';
import express = require('express');

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
    @Middleware([() => {}])
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

    @GuardProvider('guard1')
    class Guard1 {
      constructor() {}
      public guard() { }
    }

    @GuardProvider('guard2')
    @AuthGuard()
    class Guard2 {
      constructor() {}
      public guard() { }
    }

    @Controller('controller2')
    @Guard(['guard1'])
    class Controller2 {

      private readonly s1: number;
      constructor() {
        this.s1 = 12;
      }

      @Get('/')
      @Validate(Joi.object({ params: Joi.object() }))
      public findAll(): string[] {
        return ['data1', 'data2'];
      }

      @Guard(['guard2'])
      @Middleware([() => {}])
      @Validate(Joi.object({ body: Joi.object() }))
      @Put('/:id')
      public update(): string {
        return 'data1';
      }

      @Head('/check')
      public check(): string {
        return 'ok';
      }

      @Patch('/:id/metadata')
      public partialUpdate(): string {
        return 'data1';
      }

      @Delete('/:id')
      public delete(): string {
        return 'data1';
      }

      @Options('/')
      public options(): string[] {
        return ['Get', 'Post'];
      }
    }

    @Module({
      imports: [],
      controllers: [Controller2],
      providers: [],
      exports: []
    })
    class Module2 {}

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

        const archApp: ArchApp = new ArchApp(
          [ Module1, Module2 ],
          { logger: { error: () => { }, warn: () => { }, info: () => { }, debug: () => { } } }
        );
        archApp.load();

        restServer = new RestServer({
          config: { hostname: 'localhost', port: 3000 },
          sequence: new Sequence([
              new ExpressMiddleware(express.json()),
              new RegisterRoutes(),
              new StartExpress()
            ])

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
          sequence: new Sequence([ new RegisterRoutes() ])
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
          sequence: new Sequence([ new StartExpress() ])
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

      it('consume exiting port', async () => {

        let error = { message: '' };
        const archApp: ArchApp = new ArchApp([ Module1 ], { logger: { error: () => { }, warn: () => { }, info: () => { }, debug: () => { } } });
        archApp.load();

        restServer = new RestServer({
          config: { hostname: 'localhost', port: 3000 },
          sequence: new Sequence([ new RegisterRoutes(), new StartExpress() ])
        });

        await restServer.onInit(archApp);
        await restServer.onStart(archApp);

        try {
          const duplicateRestServer = new RestServer({
            config: { hostname: 'localhost', port: 3000 },
            sequence: new Sequence([ new RegisterRoutes(), new StartExpress() ])
          });
          await duplicateRestServer.onInit(archApp);
          await duplicateRestServer.onStart(archApp);
        } catch (err) {
          error = err;
        }

        expect(error).to.be.instanceOf(Error);
        expect(error.message).to.match(/address already in use/);

      });
    });

  });

});
