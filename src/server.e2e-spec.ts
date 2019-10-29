import { describe, it } from 'mocha';
import supertest from 'supertest';
import { RestServer } from './server';
import { ArchApp, Injectable, Controller, Module, GuardProvider, Guard, IGuard } from '@nodearch/core';
import { Get, Post, Validate, Middleware, Put, Delete, Options } from './decorators';
import { RegisterRoutes, StartExpress, ExpressMiddleware, Sequence } from './sequence';
import * as Joi from '@hapi/joi';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { AuthGuard, IAuthGuard } from './auth';
import express = require('express');
import { ResponseSchemas } from './swagger';
import { Upload } from './decorators';
import { expect } from 'chai';

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
      @Upload('file1')
      public create(req: express.Request, res: express.Response) {
        res.json(req.body);
      }

      @Put('/:id')
      @Upload([{name: 'file1', maxCount: 1}, {name: 'file2', maxCount: 2}])
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
      @Validate({
        body: Joi.object().keys({ a: Joi.number(), i: Joi.number().example(20).description('Desc') }).example({a: 2, i: 10}).description('Test'),
        params: Joi.object().keys({ id: Joi.number().default(3).optional() }).optional(),
        headers: Joi.object().keys({ key: Joi.string().optional().default('test') }).optional()
      })
      @Put('/:id')
      public put(req: express.Request, res: express.Response) {
        res.json(req.body);
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
      @ResponseSchemas([{
        status: 200, schema: {
          type: 'object', required: true,
          properties: { id: { type: 'integer', format: 'int64' }, name: { type: 'string' }, tag: { type: 'string' } }
        }, description: 'Test description'
      }, { status: 400, description: 'Test Error description2' }, { status: 500 }
    ])
      @Validate({ body: Joi.object().keys({
         i: Joi.number().min(6).max(100).required(),
         azza: Joi.array().items(
           Joi.object().keys({ oha: Joi.number().default(1).max(100), zota: Joi.string().default('sas').required().example('s')  })
        ).optional()
        }).required() })
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

      await fs.promises.mkdir(path.join(os.tmpdir(), 'swagger'));

      archApp = new ArchApp([ Module1, Module2 ],
        {
          logger: { error: () => {}, warn: () => {}, info: () => {}, debug: () => {} },
          guards: [Guard1, Guard2, Guard3],
          extensions: [
            new RestServer(
              {
                config: { hostname: 'localhost', port: 3000,
                joiValidationOptions: { abortEarly: false, allowUnknown: true, presence: 'required' },
                swagger: {
                  path: path.join(os.tmpdir(), 'swagger'),
                  options: { servers: [{ url: 'http://localhost:3000' }], info: { version: '0.1.0' } }
                },
               },
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
      await fs.promises.unlink(path.join(os.tmpdir(), 'swagger/swagger.json'));
      const uploadedFiles = await fs.promises.readdir(path.join(os.tmpdir(), 'nodearch-file-uploads'));

      for (const fileToDelete of uploadedFiles) {
        await fs.promises.unlink(path.join(os.tmpdir(), 'nodearch-file-uploads', fileToDelete));
      }

      await fs.promises.rmdir(path.join(os.tmpdir(), 'nodearch-file-uploads'));
      await fs.promises.rmdir(path.join(os.tmpdir(), 'swagger'));
    });

    describe('all requests actions without middlewares', () => {
      it('Get Request', async () => {
        return request.get('/controller1')
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)
          .expect(['data1', 'data2']);
      });

      it('Post Request Upload File', async () => {
        return request.post('/controller1')
          .type('form')
          .attach('file1', path.join(__dirname, 'server.ts'))
          .expect('Content-Type', /json/)
          .expect(200)
          .then(response => {
            expect(response.body).to.deep.nested.include({
              'file1.destination': '/tmp/nodearch-file-uploads', 'file1.fieldname': 'file1',
              'file1.originalname': 'server.ts'
            });
          });
      });

      it('Failed Put Request Upload File', async () => {
        return request.put('/controller1/1')
        .type('form')
        .attach('file2', path.join(__dirname, 'server.ts'))
        .attach('file2', path.join(__dirname, 'server.ts'))
        .attach('file2', path.join(__dirname, 'server.ts'))
        .expect('Content-Type', /json/)
        .expect(400)
        .then(response => {

          expect(response.body.message).to.equal('FileUpload: Unexpected field');
        });
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

    describe('Middelwares Flow', () => {
      it('pass all middelwares in right order', async () => {
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
          .send({ a: 1, i: 1 })
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)
          .expect({ i: 4, a: 1 });
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
          .send({ i: 1, a: 'test' })
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(400)
          .expect([{
            message: '"body.a" must be a number',
            path: [ 'body', 'a' ],
            type: 'number.base',
            context: { value: 'test', key: 'a', label: 'body.a' }
          }]);
      });

    });

    describe('Guard Flow', () => {
      it('pass all guards & middlewares & joi validation', async () => {
        return request.put('/controller3/5')
          .set('Authorization', 'auth')
          .send({ i: 7, azza: [{ oha: 0, zota: 'string' }] })
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)
          .expect({ userId: 10, ok: 1, i: 7, azza: [{ oha: 0, zota: 'string' }] });
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
            message: '"body.i" is required',
            path: [ 'body', 'i' ],
            type: 'any.required',
            context: { key: 'i', label: 'body.i' }
          }]);
      });

    });

    describe('Swagger Doc', () => {

      it('check created swagger file', async () => {

        const swaggerFile = await fs.promises.readFile(path.join(os.tmpdir(), 'swagger/swagger.json'), 'utf8');
        const openApiSchema = JSON.parse(swaggerFile);

        expect(openApiSchema).to.deep.include({ openapi: '3.0.0', servers: [{ url: 'http://localhost:3000' }], info: { version: '0.1.0' } });

        expect(openApiSchema.components.schemas).to.deep.equals({
          'put-controller2-body': {
            type: 'object', description: 'Test', required: true, example: {  a: 2, i: 10 },
            properties: {
              a: { type: 'number' }, i: { type: 'number', description: 'Desc', required: true, example: 20 }
            }
          },
          'put-controller3-body': {
            type: 'object',
            properties: {
              i: {  type: 'number', required: true, minimum: 6,  maximum: 100 },
              azza: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    oha: { type: 'number', default: 1, required: true, maximum: 100 },
                    zota: { type: 'string', default: 'sas', required: true, example: 's' }
                  }
                },
                required: false
              }
            },
            required: true
          },
          'put-controller3-response': {
            type: 'object',
            required: true,
            properties: {
              id: { type: 'integer', format: 'int64' },
              name: { type: 'string' },
              tag: { type: 'string' }
            }
          }
        });

        expect(openApiSchema.paths).to.deep.equals({
          '/controller1': {
            get: {
              tags: ['controller1'], operationId: 'get-controller1', parameters: [], responses: { 200: { description: '' } }
            },
            post: {
              tags: ['controller1'], operationId: 'post-controller1', parameters: [], responses: { 200: { description: '' } },
              requestBody: {
                content: {
                  'multipart/form-data': {
                    schema: { type: 'object', properties: { file1: { type: 'string', format: 'binary' } } }
                  }
                }
              }
            },
            options: {
              tags: ['controller1'], operationId: 'options-controller1', parameters: [], responses: { 200: { description: '' } }
            }
          },
          '/controller1/{id}': {
            put: {
              tags: ['controller1'], operationId: 'put-controller1', responses: {  200: { description: '' } },
              parameters: [{ name: 'id', in: 'path', type: 'string', required: true }],
              requestBody: {
                content: {
                  'multipart/form-data': {
                    schema: {
                      type: 'object',
                      properties: {
                        file1: { type: 'string', format: 'binary' },
                        file2: { type: 'array', items: { type: 'string', format: 'binary' }, maxItems: 2 }
                      }
                    }
                  }
                }
              }
            },
            delete: {
              tags: ['controller1'], operationId: 'delete-controller1', responses: { 200: { description: '' } },
              parameters: [{ name: 'id', in: 'path', type: 'string', required: true }]
            }
          },
          '/controller2': {
            post: { tags: ['controller2'], operationId: 'post-controller2', parameters: [], responses: { 200: { description: '' } } }
          },
          '/controller2/{id}': {
            put: {
              tags: ['controller2'], operationId: 'put-controller2', responses: { 200: { description: '' } },
              parameters: [
                { type: 'string', default: 3, required: true, name: 'id', in: 'path' },
                { name: 'key', in: 'header', type: 'string', default: 'test', required: false }
              ],
              requestBody: {
                required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/put-controller2-body' } } }
              }
            }
          },
          '/controller3/{id}': {
            put: {
              tags: ['controller3'],
              operationId: 'put-controller3',
              parameters: [{ name: 'id', in: 'path', type: 'string', required: true }],
              requestBody: {
                required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/put-controller3-body' } } }
              },
              responses: {
                200: {
                  description: 'Test description',
                  content: { 'application/json': { schema: { $ref: '#/components/schemas/put-controller3-response' } } }
                },
                400: { description: 'Test Error description2' }, 500: { description: '' }
              }
            }
          }
        });
      });

    });
  });
});
