import { describe, it } from 'mocha';
import supertest from 'supertest';
import { RestServer } from './server';
import { ArchApp, Injectable, Controller, Module, GuardProvider, Guard, IGuard } from '@nodearch/core';
import { Get, Post, Validate, Middleware, Put, Patch, Delete, Options } from './decorators';
import { RegisterRoutes, StartExpress, ExpressMiddleware, Sequence } from './sequence';
import * as Joi from '@hapi/joi';
import { AuthGuard, IAuthGuard } from './auth';
import express = require('express');

describe('[e2e]server', () => {

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
      public findAll(req: express.Request, res: express.Response) {
        res.json(['data1', 'data2']);
      }

      @Post('/')
      public create(req: express.Request, res: express.Response) {
        res.json(req.body);
      }

      @Put('/:id')
      public update(req: express.Request, res: express.Response) {
        req.body.id = Number(req.params.id);
        res.json(req.body);
      }

      @Delete('/:id')
      public remove(req: express.Request, res: express.Response) {
        res.json({ id: Number(req.params.id) });
      }

      @Options('/')
      public options(req: express.Request, res: express.Response){
        res.json(['Get', 'Post']);
      }
    }

    const middleware1 = (req: express.Request, res: express.Response, next: any) => {
      if (req.body.i === 1) {
        ++req.body.i;
      }
      else {
        req.body.i = 0;
      }
      next();
    };

    const middleware2 = (req: express.Request, res: express.Response, next: any) => {
      if (req.body.i === 2) {
        ++req.body.i;
        next();
      }
      else {
        res.status(400).json({ msg: 'Bad Request' });
      }
    };

    const middleware3 = (req: express.Request, res: express.Response, next: any) => {
      if (req.body.k) {
        res.status(400).json({ msg: 'Bad Request' });
      }
      else {
        ++req.body.i;
        next();
      }
    };

    @Middleware([ middleware1, middleware2 ])
    @Controller('controller2')
    class Controller2 {

      constructor() {}

      @Middleware(middleware3)
      @Post('/')
      public create(req: express.Request, res: express.Response) {
        res.json(req.body);
      }

      @Middleware(middleware3)
      @Validate(Joi.object().keys({
        body: Joi.object().keys({ a: Joi.string().required() }).required(),
        params: Joi.object().keys({ id: Joi.number().required() }).required()
      }))
      @Put('/:id')
      public put(req: express.Request, res: express.Response) {

        if ( typeof req.params.id === 'number') {
          res.json(req.body);
        }
        else {
          res.status(400).json({ msg: 'Bad Request' });
        }
      }
    }

    @Module({
      imports: [],
      controllers: [Controller1, Controller2],
      providers: [Provider1],
      exports: []
    })
    class Module1 {}

    @GuardProvider('authGuard1')
    @AuthGuard()
    class Guard1 implements IGuard {
      constructor() {}
      public guard(req: express.Request, res: express.Response, next: any) {
        if (req.headers.authorization === 'auth') {
          req.body.userId = 1;
          next();
        }
        else {
          res.status(403).json({ msg: 'unAuth' });
        }
      }
    }

    @GuardProvider('authGuard2')
    @AuthGuard()
    class Guard2 implements IAuthGuard {
      constructor() {}
      public guard(req: express.Request, res: express.Response, next: any) {
        req.body.userId = req.body.userId + 5;
        next();
      }
    }

    @GuardProvider('authGuard3')
    @AuthGuard()
    class Guard3 implements IAuthGuard {
      constructor() {}
      public guard(req: express.Request, res: express.Response, next: any) {
        req.body.userId = req.body.userId + 4;
        next();
      }
    }

    const middleware4 = (req: express.Request, res: express.Response, next: any) => {
      if ( req.params.id === '5' ) {
        req.body.ok = 1;
      }
      next();
    };

    const middleware5 = (req: express.Request, res: express.Response, next: any) => {
      if ( req.params.id === '1' ) {
        res.status(400).json({ msg: 'invalid id' });
      }
      else {
        next();
      }
    };

    @Controller('controller3')
    @Middleware([ middleware4 ])
    @Guard(['authGuard1'])
    class Controller3 {

      private readonly s1: number;
      constructor() {
        this.s1 = 12;
      }

      @Middleware([ middleware5 ])
      @Guard(['authGuard2', 'authGuard3'])
      @Validate(Joi.object({ body: Joi.object().keys({ i: Joi.number().required() }).required() }))
      @Put('/:id')
      public update(req: express.Request, res: express.Response) {
        res.json(req.body);
      }

    }

    @Module({
      imports: [],
      controllers: [Controller3],
      providers: [],
      exports: []
    })
    class Module2 {}

    let archApp: ArchApp;
    let restServer: RestServer;
    let request: supertest.SuperTest<supertest.Test>;

    before(async () => {

      archApp = new ArchApp([ Module1, Module2 ],
        {
          logger: { error: () => {}, warn: () => {}, info: () => {}, debug: () => {} },
          guards: [Guard1, Guard2, Guard3],
          extensions: [
            new RestServer(
              {
                config: { hostname: 'localhost', port: 3000, joiValidationOptions: { abortEarly: false, allowUnknown: true } },
                sequence: new Sequence([
                  new ExpressMiddleware(express.json()),
                  new ExpressMiddleware(express.urlencoded({ extended: false })),
                  new RegisterRoutes(),
                  new StartExpress()
                ])
              }
            )
          ]
        }
      );

      await archApp.load();
      restServer = archApp.getExtInstances<RestServer>(RestServer)[0];
      request = supertest(restServer.expressApp);
    });

    after(async () => {
      restServer.close();
    });

    describe('all requests actions without middlewares', () => {
      it('Get Request', async () => {
        return request.get('/controller1')
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)
          .expect(['data1', 'data2']);
      });

      it('Post Request', async () => {
        return request.post('/controller1')
          .send({ ok: 1 })
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)
          .expect({ ok: 1 });
      });

      it('Put Request', async () => {
        return request.put('/controller1/1')
          .send({ ok: 2 })
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)
          .expect({ id: 1, ok: 2 });
      });

      it('Delete Request', async () => {
        return request.delete('/controller1/1')
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)
          .expect({ id: 1 });
      });

      it('Head Request', async () => {
        return request.head('/controller1')
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200);
      });

      it('Options Request', async () => {
        return request.options('/controller1')
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)
          .expect(['Get', 'Post']);
      });
    });

    describe('Midelwares Flow', () => {
      it('pass all midelwares in right order', async () => {
        return request.post('/controller2')
          .send({ i: 1 })
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)
          .expect({ i: 4 });
      });

      it('request failed cuz of middleware validation', async () => {
        return request.post('/controller2')
          .send({ i: 2 })
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(400)
          .expect({ msg: 'Bad Request' });
      });

    });

    describe('Joi Validation', () => {
      it('pass all midelwares & joi validation', async () => {
        return request.put('/controller2/5')
          .send({ i: 1, a: 'test' })
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)
          .expect({ i: 4, a: 'test' });
      });

      it('invalid joi request but failed cuz middleware', async () => {
        return request.put('/controller2/1')
          .send({ i: 1, k: 5 })
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(400)
          .expect({ msg: 'Bad Request' });
      });

      it('invalid joi request failed cuz joi validation', async () => {
        return request.put('/controller2/2')
          .send({ i: 1, a: 4 })
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(400)
          .expect([{
            message: '"a" must be a string',
            path: [ 'body', 'a' ],
            type: 'string.base',
            context: { value: 4, key: 'a', label: 'a' }
          }]);
      });

    });

    describe('Guard Flow', () => {
      it('pass all guards & middlewares & joi validation', async () => {
        return request.put('/controller3/5')
          .set('Authorization', 'auth')
          .send({ i: 1 })
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)
          .expect({ i: 1, userId: 10, ok: 1 });
      });

      it('invalid joi request but failed cuz auth guard', async () => {
        return request.put('/controller3/1')
          .send({ test: 1 })
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(403);
      });

      it('pass auth guard failed cuz middleware', async () => {
        return request.put('/controller3/1')
          .set('Authorization', 'auth')
          .send({ i: 1 })
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(400);
      });

      it('invalid joi request failed cuz joi validation', async () => {
        return request.put('/controller3/2')
        .set('Authorization', 'auth')
          .send({ test: 1 })
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(400)
          .expect([{
            message: '"i" is required',
            path: [ 'body', 'i' ],
            type: 'any.required',
            context: { key: 'i', label: 'i' }
          }]);
      });

    });
  });
});
