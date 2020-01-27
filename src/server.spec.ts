import { describe, it } from 'mocha';
import { expect } from 'chai';
import { RestServer } from './server';
import { ArchApp, Injectable, Controller, Module } from '@nodearch/core';
import { HttpGet, HttpPost, Validate, Middleware, HttpPut, HttpHead, HttpPatch, HttpDelete, HttpOptions } from './decorators';
import { RegisterRoutes, StartExpress, ExpressMiddleware, Sequence } from './sequence';
import * as http from 'http';
import * as Joi from '@hapi/joi';
import express = require('express');

const fakeLogger = { error: () => { }, warn: () => { }, info: () => { }, debug: () => { } };

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

      @HttpGet('/')
      public findAll(): string[] {
        return ['data1', 'data2'];
      }

      @HttpPost('/')
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

    @Controller('controller2')
    class Controller2 {

      private readonly s1: number;
      constructor() {
        this.s1 = 12;
      }

      @HttpGet('/')
      @Validate({ params: Joi.object() })
      public findAll(): string[] {
        return ['data1', 'data2'];
      }

      @Middleware([() => {}])
      @Validate({ body: Joi.object() })
      @HttpPut('/:id')
      public update(): string {
        return 'data1';
      }

      @HttpHead('/check')
      public check(): string {
        return 'ok';
      }

      @HttpPatch('/:id/metadata')
      public partialUpdate(): string {
        return 'data1';
      }

      @HttpDelete('/:id')
      public delete(): string {
        return 'data1';
      }

      @HttpOptions('/')
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
          logger: fakeLogger,
          sequence: new Sequence([
              new ExpressMiddleware(express.json()),
              new RegisterRoutes(),
              new StartExpress()
            ])

        });

        await restServer.onStart(archApp);

        expect(restServer.server).to.be.instanceOf(http.Server);

      });

      it('forgot StartExpress', async () => {

        let error = { message: '' };
        const archApp: ArchApp = new ArchApp([ Module1 ], { logger: fakeLogger });
        archApp.load();

        restServer = new RestServer({
          config: { hostname: 'localhost', port: 3000 },
          logger: fakeLogger,
          sequence: new Sequence([ new RegisterRoutes() ])
        });

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
        const archApp: ArchApp = new ArchApp([ Module1 ], { logger: fakeLogger });
        archApp.load();

        restServer = new RestServer({
          config: { hostname: 'localhost', port: 3000 },
          logger: fakeLogger,
          sequence: new Sequence([ new StartExpress() ])
        });

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
        const archApp: ArchApp = new ArchApp([ Module1 ], { logger: fakeLogger });
        archApp.load();

        restServer = new RestServer({
          config: { hostname: 'localhost', port: 3000 },
          logger: fakeLogger,
          sequence: new Sequence([ new RegisterRoutes(), new StartExpress() ])
        });

        await restServer.onStart(archApp);

        try {
          const duplicateRestServer = new RestServer({
            config: { hostname: 'localhost', port: 3000 },
            logger: fakeLogger,
            sequence: new Sequence([ new RegisterRoutes(), new StartExpress() ])
          });
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
