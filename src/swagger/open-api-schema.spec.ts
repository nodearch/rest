import { describe, it } from 'mocha';
import { expect } from 'chai';
import { stub, SinonStub } from 'sinon';
import { OpenApiSchema } from './open-api-schema';
import * as metadata from '../metadata';
import { HttpMethod } from '../enums';
import Joi from '@hapi/joi';
import { ISwagger } from './interfaces';
import { ApiKeyIn } from './enums';

describe('swagger/open-api-schema', () => {

  let getMethodValidationSchema: SinonStub<any, any>, getControllerMethodSwagger: SinonStub<any, any>,
    getMethodFileUpload: SinonStub<any, any>, getControllerSwagger: SinonStub<any, any>;

  beforeEach(() => {
    getMethodValidationSchema = stub(metadata.controller, 'getMethodValidationSchema').returns({});
    getControllerMethodSwagger = stub(metadata.controller, 'getControllerMethodSwagger').returns({});
    getControllerSwagger = stub(metadata.controller, 'getControllerSwagger').returns({});
    getMethodFileUpload = stub(metadata.controller, 'getMethodFileUpload').returns([]);
  });

  afterEach(() => {
    getMethodValidationSchema.restore();
    getControllerMethodSwagger.restore();
    getControllerSwagger.restore();
    getMethodFileUpload.restore();
  });

  describe('OpenApiSchema', () => {

    describe('One Controller One End Point', () => {
      it('Should return swagger for end point have basic config', () => {

        const controllers: any[] = [{
          controllerInfo: { classInstance: {}, prefix: 'controller1', methods: [{ name: 'find' }] },
          methods: [{ httpPath: '/controller1', httpMethod: HttpMethod.GET, name: 'find' }]
        }];

        const openApiSchema = new OpenApiSchema(controllers, { info: {} });
        expect(openApiSchema).to.deep.equals({
          openapi: '3.0.0', servers: [], info: {}, components: { schemas: {} }, tags: [{ name: 'controller1' }],
          paths: {
            '/controller1': {
              get: { tags: ['controller1'], security: [], operationId: 'get-controller1', parameters: [], responses: { 200: { description: '' } } }
            }
          }
        });
      });

      it('Should return swagger for end point have simple joi schema config', () => {

        const controllers: any[] = [{
          controllerInfo: { classInstance: {}, prefix: '', methods: [{ name: 'create' }] },
          methods: [{ httpPath: '/test/:id/test/:name', httpMethod: HttpMethod.POST, name: 'create' }]
        }];

        getMethodValidationSchema.returns({
          body: Joi.object().keys({ name: Joi.string().required(), age: Joi.number().optional() }),
          params: Joi.object().keys({ name: Joi.string().pattern(/^./).optional() })
        });

        const openApiSchema = new OpenApiSchema(controllers);

        expect(openApiSchema.components).to.deep.equals( {
          schemas: {
            'post-body': {
              type: 'object', required: true,
              properties: {  name: { type: 'string', required: true }, age: { type: 'number', required: false } }
            }
          }
        });

        expect(openApiSchema.paths).to.deep.nested.include({
          '/test/{id}/test/{name}.post.tags': ['base'],
          '/test/{id}/test/{name}.post.operationId': 'post',
          '/test/{id}/test/{name}.post.parameters': [
            { type: 'string', required: true, pattern: '/^./', name: 'name', in: 'path' },
            { name: 'id', in: 'path', type: 'string', required: true }
          ],
        });
      });

      it('Should return swagger for end point have complex joi schema config', () => {

        const controllers: any[] = [{
          controllerInfo: { classInstance: {}, prefix: 'controller2', methods: [{ name: 'update' }] },
          methods: [{ httpPath: '/controller2/test/:id/test', httpMethod: HttpMethod.PUT, name: 'update' }]
        }];

        getMethodValidationSchema.returns({
          body: Joi.object().keys({
            id: Joi.string().guid().max(7).required().example(2),
            limit: Joi.number().min(4).optional(),
            enable: Joi.boolean().default(true).example(false).valid(true).description('Enable'),
            dates: Joi.array().items(Joi.date().iso()).default(['11-11-1991', '12-01-1999']).min(1).max(10).description('the tags')
           }).example({ id: 2 }).description('Update Data'),
          params: Joi.object().keys({ name: Joi.string().pattern(/^./).optional() }),
          headers: Joi.object().keys({ apiKey: Joi.string().pattern(/^./).required(), auth: Joi.string().regex(/^./).optional() })
        });

        const openApiSchema = new OpenApiSchema(controllers, { info: { title: 'Testing' }, servers: [{ url: 'http://test.com' }] });

        expect(openApiSchema.servers).to.deep.equals([{ url: 'http://test.com' }]);
        expect(openApiSchema.info).to.deep.equals({ title: 'Testing' });
        expect(openApiSchema.components).to.deep.equals({
          schemas: {
            'put-controller2-body': {
              type: 'object',  description: 'Update Data', required: true, example: { id: 2 },
              properties: {
                id: { type: 'string', required: true, format: 'uuid', maxLength: 7 },
                limit: { type: 'number', required: false, minimum: 4 },
                enable: { type: 'boolean', default: true, description: 'Enable', required: true, example: false, enum: [true] },
                dates: {
                  type: 'array', description: 'the tags', items: { type: 'string', format: 'date', required: true },
                  default: ['11-11-1991', '12-01-1999'], required: true, minItems: 1, maxItems: 10
                }
              }
            }
          }
        });

        expect(openApiSchema.paths).to.deep.nested.include({
          '/controller2/test/{id}/test.put.tags': ['controller2'],
          '/controller2/test/{id}/test.put.operationId': 'put-controller2',
          '/controller2/test/{id}/test.put.parameters': [
            { name: 'id', in: 'path', type: 'string',  required: true  },
            { name: 'apiKey', in: 'header', type: 'string', required: true, pattern: '/^./' },
            { name: 'auth', in: 'header', type: 'string', required: false, pattern: '/^./' }
          ],
          '/controller2/test/{id}/test.put.requestBody.content.application/json.schema.$ref': '#/components/schemas/put-controller2-body',
        });
      });

      it('Should return swagger for end point have file upload', () => {

        const controllers: any[] = [{
          controllerInfo: { classInstance: {}, prefix: 'controller2', methods: [{ name: 'update' }] },
          methods: [{ httpPath: '/controller2/test/:id/test', httpMethod: HttpMethod.PUT, name: 'update' }]
        }];

        getMethodFileUpload.returns([{ name: 'file1' }, { name: 'file2', maxCount: 3 }]);

        const openApiSchema = new OpenApiSchema(controllers, { servers: [{ url: 'http://test.com' }] }, { presence: 'optional' });

        expect(openApiSchema.paths).to.deep.nested.include({
          '/controller2/test/{id}/test.put.tags': ['controller2'],
          '/controller2/test/{id}/test.put.operationId': 'put-controller2',
          '/controller2/test/{id}/test.put.requestBody.content.multipart/form-data.schema': {
            type: 'object',
            properties: {
              file1: { type: 'string', format: 'binary' },
              file2: { type: 'array', maxItems: 3, items: { type: 'string', format: 'binary' } }
            }
          }
        });
      });

      it('Should return swagger for end point have complex joi schema config & swagger responses & file upload', () => {

        const controllers: any[] = [{
          controllerInfo: { classInstance: {}, prefix: 'controller2', methods: [{ name: 'update' }] },
          methods: [{ httpPath: '/controller2/test/:id/test', httpMethod: HttpMethod.PUT, name: 'update' }]
        }];

        const swaggerConfig: ISwagger = {responses: [{
            status: 200, schema: {
              type: 'object', required: true,
              properties: { id: { type: 'integer', format: 'int64' }, name: { type: 'string' }, tag: { type: 'string' } }
            }, description: 'Test description'
          }, { status: 400, description: 'Test Error description2' }, { status: 500 }
        ]};

        getControllerMethodSwagger.returns(swaggerConfig);
        getMethodFileUpload.returns([{ name: 'file1' }, { name: 'file2', maxCount: 3 }]);
        getMethodValidationSchema.returns({
          body: Joi.object().keys({
            id: Joi.string().guid().max(7).required().example(2).description('Id')
              .valid('OOII-YJKK', 'OOII-IOPQ', 'OOII-H0UK'),
            data: Joi.object().keys({
              likes: Joi.array().items(Joi.object().keys({
                date: Joi.date().example('11-11-1991').required(),
                times: Joi.array().items(Joi.number().integer().valid(1, 2)),
                userId: Joi.number().integer().max(100).min(1).example(1).default(2).description('User Id')
              })).unique().example([]),
            key: Joi.string().base64().min(100).default('test'),
            url: Joi.string().dataUri().example('http://test.com')
             })
              .max(10).min(12).default({ id: 'OOII-YJKK' })
              .optional(),
            binaryFile: Joi.binary().encoding('base64'),
            file1: Joi.object().required().description('Enable'),
           }).example({ id: 2 }).description('Update Data'),
          params: Joi.object().keys({ id: Joi.string().pattern(/^./).optional() }),
          headers: Joi.object().keys({ apiKey: Joi.string().pattern(/^./).required() })
        });

        const openApiSchema = new OpenApiSchema(controllers, { servers: [{ url: 'http://test.com' }] }, { presence: 'optional' });

        expect(openApiSchema.components).to.deep.equals({
          schemas: {
            'put-controller2-response': {
              type: 'object', required: true,
              properties: { id: { type: 'integer', format: 'int64' }, name: { type: 'string' }, tag: { type: 'string' } }
            }
          }
        });

        expect(openApiSchema.paths).to.deep.nested.include({
          '/controller2/test/{id}/test.put.tags': ['controller2'],
          '/controller2/test/{id}/test.put.operationId': 'put-controller2',
          '/controller2/test/{id}/test.put.parameters': [
            { type: 'string', required: true, pattern: '/^./', name: 'id', in: 'path' },
            { name: 'apiKey', in: 'header', type: 'string', required: true, pattern: '/^./' }
          ],
          '/controller2/test/{id}/test.put.requestBody.content.multipart/form-data.schema': {
            type: 'object', description: 'Update Data', example: { id: 2 },
            properties: {
              id: {
                type: 'string', required: true, format: 'uuid', maxLength: 7,
                description: 'Id', enum: [ 'OOII-YJKK', 'OOII-IOPQ', 'OOII-H0UK' ]
              },
              data: {
                type: 'object', required: false, maxProperties: 10,  minProperties: 12,
                default: { id: 'OOII-YJKK' },
                properties: {
                  key: { type: 'string', format: 'byte', minLength: 100, default: 'test', required: false },
                  url: { type: 'string', format: 'uri', example: 'http://test.com', required: false },
                  likes: {
                    type: 'array', example: [], uniqueItems: true, required: false,
                    items: {
                      type: 'object', required: false,
                      properties: {
                        date: { type: 'string', required: true,  example: '11-11-1991', format: 'date' },
                        times: { type: 'array', items: { type: 'integer', enum: [1, 2], required: false }, required: false },
                        userId: { type: 'integer', required: false,  example: 1, default: 2, maximum: 100, minimum: 1, description: 'User Id' }
                      }
                    }
                  }
                }
              },
              binaryFile: { type: 'string', format: 'byte', required: false },
              file1: { type: 'string', format: 'binary' },
              file2: { type: 'array', maxItems: 3, items: { type: 'string', format: 'binary' } }
            }
          },
          '/controller2/test/{id}/test.put.responses': {
            200: {
              description: 'Test description',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/put-controller2-response' } } }
            },
            400: { description: 'Test Error description2' }, 500: { description: '' }
          },
        });
      });

      it('Should return swagger for text end point have simple joi schema config & text response', () => {

        const controllers: any[] = [{
          controllerInfo: { classInstance: {}, prefix: 'controller1', methods: [{ name: 'find' }] },
          methods: [{ httpPath: '/controller1/test/:id/test/:name', httpMethod: HttpMethod.GET, name: 'find' }]
        }];

        const swaggerConfig: ISwagger = { responses: [{
            status: 200, isArray: true, schema: {
              type: 'string', required: true,
            }, description: 'Test description'
          }, { status: 400, description: 'Test Error description2' }
        ]};

        getControllerMethodSwagger.returns(swaggerConfig);
        getMethodValidationSchema.returns({
          body: Joi.number().required().default(1),
          params: Joi.object().keys({ name: Joi.string().pattern(/^./).optional() }),
          query: Joi.object().keys({ query: Joi.any() })
        });
        const openApiSchema = new OpenApiSchema(controllers);

        expect(openApiSchema.components).to.deep.equals({
          schemas: {
            'get-controller1-body': { type: 'number', default: 1, required: true },
            'get-controller1-response': { type: 'string', required: true }
          }
        });

        expect(openApiSchema.paths).to.deep.equals({
          '/controller1/test/{id}/test/{name}': {
            get: {
              tags: ['controller1'],
              security: [],
              operationId: 'get-controller1',
              parameters: [
                { type: 'string', required: true, pattern: '/^./', name: 'name', in: 'path' },
                { name: 'id', in: 'path', type: 'string', required: true },
                { name: 'query', in: 'query' }
              ],
              requestBody: {
                required: true,
                content: { 'text/plain': { schema: { $ref: '#/components/schemas/get-controller1-body' } } }
              },
              responses: {
                200: {
                  description: 'Test description',
                  content: { 'text/plain': { schema: { type: 'array', items: { $ref: '#/components/schemas/get-controller1-response' } } } }
                },
                400: { description: 'Test Error description2' }
              }
            }
          }
        });
      });

      it('Should return swagger for end point have simple joi schema config, tag, basic auth', () => {

        const controllers: any[] = [{
          controllerInfo: { classInstance: {}, prefix: '', methods: [{ name: 'create' }] },
          methods: [{ httpPath: '/test/:id/test/:name', httpMethod: HttpMethod.POST, name: 'create' }]
        }];

        getMethodValidationSchema.returns({
          body: Joi.object().keys({ name: Joi.string().required(), age: Joi.number().optional() }),
          params: Joi.object().keys({ name: Joi.string().pattern(/^./).optional() })
        });

        getControllerSwagger.returns({ tag: { description: 'test' } });

        const openApiSchema = new OpenApiSchema(controllers, { security: { applyForAll: true, definitions: { basicAuth: true } } });

        expect(openApiSchema.tags[0]).to.deep.equals({ name: 'base', description: 'test' });
        expect(openApiSchema.securityDefinitions).to.deep.equals({ basicAuth: { type: 'basic' } });

        expect(openApiSchema.paths).to.deep.nested.include({
          '/test/{id}/test/{name}.post.tags': ['base'],
          '/test/{id}/test/{name}.post.operationId': 'post',
          '/test/{id}/test/{name}.post.security': [{ basicAuth: [] }]
        });
      });

      it('Should return swagger for end point apiKey auth', () => {

        const controllers: any[] = [{
          controllerInfo: { classInstance: {}, prefix: '', methods: [{ name: 'create' }] },
          methods: [{ httpPath: '/test/:id/test/:name', httpMethod: HttpMethod.POST, name: 'create' }]
        }];

        getControllerSwagger.returns({ securityDefinitions: { basicAuth: true, apiKeysAuth: ['authKey2'] } });
        getControllerMethodSwagger.returns({ securityDefinitions: { apiKeysAuth: ['authKey2'] } });

        const openApiSchema = new OpenApiSchema(controllers, {
          security: { applyForAll: true, definitions: {
            basicAuth: true,
            apiKeysAuth: [{ key: 'authKey1' }, { key: 'authKey2', in: ApiKeyIn.Query }] }
          }
        });

        expect(openApiSchema.securityDefinitions).to.deep.equals({
          basicAuth: { type: 'basic' },
          authKey1: { type: 'apiKey', name: 'authKey1', in: 'header' },
          authKey2: { type: 'apiKey', name: 'authKey2', in: 'query' }
        });

        expect(openApiSchema.paths).to.deep.nested.include({
          '/test/{id}/test/{name}.post.tags': ['base'],
          '/test/{id}/test/{name}.post.operationId': 'post',
          '/test/{id}/test/{name}.post.security': [{ authKey2: [] }]
        });
      });

      it('Should return swagger for end point basicAuth, summary', () => {

        const controllers: any[] = [{
          controllerInfo: { classInstance: {}, prefix: '', methods: [{ name: 'create' }] },
          methods: [{ httpPath: '/test/:id/test/:name', httpMethod: HttpMethod.POST, name: 'create' }]
        }];

        getControllerSwagger.returns(null);
        getControllerMethodSwagger.returns({ securityDefinitions: { basicAuth: true }, summary: 'method summary' });

        const openApiSchema = new OpenApiSchema(controllers, {
          security: { applyForAll: true, definitions: {
            basicAuth: true,
            apiKeysAuth: [{ key: 'authKey1' }] }
          }
        });

        expect(openApiSchema.securityDefinitions).to.deep.equals({
          basicAuth: { type: 'basic' },
          authKey1: { type: 'apiKey', name: 'authKey1', in: 'header' }
        });

        expect(openApiSchema.paths).to.deep.nested.include({
          '/test/{id}/test/{name}.post.tags': ['base'],
          '/test/{id}/test/{name}.post.operationId': 'post',
          '/test/{id}/test/{name}.post.security': [{ basicAuth: [] }],
          '/test/{id}/test/{name}.post.summary': 'method summary'
        });
      });

      it('Should return swagger for end point multi auth, summary', () => {

        const controllers: any[] = [{
          controllerInfo: { classInstance: {}, prefix: '', methods: [{ name: 'create' }] },
          methods: [{ httpPath: '/test/:id/test/:name', httpMethod: HttpMethod.POST, name: 'create' }]
        }];

        getControllerSwagger.returns({ securityDefinitions: { basicAuth: true, apiKeysAuth: ['authKey2'] }, summary: 'ctrl summary' });

        const openApiSchema = new OpenApiSchema(controllers, {
          security: { applyForAll: true, definitions: {
            basicAuth: true,
            apiKeysAuth: [{ key: 'authKey1' }, { key: 'authKey2', in: ApiKeyIn.Query }] }
          }
        });

        expect(openApiSchema.securityDefinitions).to.deep.equals({
          basicAuth: { type: 'basic' },
          authKey1: { type: 'apiKey', name: 'authKey1', in: 'header' },
          authKey2: { type: 'apiKey', name: 'authKey2', in: 'query' }
        });

        expect(openApiSchema.paths).to.deep.nested.include({
          '/test/{id}/test/{name}.post.tags': ['base'],
          '/test/{id}/test/{name}.post.operationId': 'post',
          '/test/{id}/test/{name}.post.security': [{ basicAuth: [] }, { authKey2: [] }],
          '/test/{id}/test/{name}.post.summary': 'ctrl summary'
        });
      });

      it('Should disable entire app end points', () => {

        const controllers: any[] = [{
          controllerInfo: { classInstance: {}, prefix: '', methods: [{ name: 'create' }] },
          methods: [{ httpPath: '/test/:id/test/:name', httpMethod: HttpMethod.POST, name: 'create' }]
        }];

        getControllerSwagger.returns({ securityDefinitions: { basicAuth: true, apiKeysAuth: ['authKey2'] }, summary: 'ctrl summary' });

        const openApiSchema = new OpenApiSchema(controllers, {
          security: { applyForAll: true, definitions: {
            basicAuth: true,
            apiKeysAuth: [{ key: 'authKey1' }, { key: 'authKey2', in: ApiKeyIn.Query }] }
          },
          enableAll: false
        });

        expect(openApiSchema.securityDefinitions).to.deep.equals({
          basicAuth: { type: 'basic' },
          authKey1: { type: 'apiKey', name: 'authKey1', in: 'header' },
          authKey2: { type: 'apiKey', name: 'authKey2', in: 'query' }
        });

        expect(openApiSchema.paths).to.deep.equal({});
      });

      it('Should disable entire controller end points', () => {

        const controllers: any[] = [{
          controllerInfo: { classInstance: {}, prefix: '', methods: [{ name: 'create' }] },
          methods: [{ httpPath: '/test/:id/test/:name', httpMethod: HttpMethod.POST, name: 'create' }]
        }];

        getControllerSwagger.returns({ enable: false });

        const openApiSchema = new OpenApiSchema(controllers, {
          enableAll: true
        });

        expect(openApiSchema.paths).to.deep.equal({});
      });

      it('Should disable one controller end point', () => {

        const controllers: any[] = [{
          controllerInfo: { classInstance: {}, prefix: '', methods: [{ name: 'create' }] },
          methods: [{ httpPath: '/test/:id/test/:name', httpMethod: HttpMethod.POST, name: 'create' }]
        }];

        getControllerSwagger.returns({ enable: true });
        getControllerMethodSwagger.returns({ enable: false });

        const openApiSchema = new OpenApiSchema(controllers, {
          enableAll: true
        });

        expect(openApiSchema.paths).to.deep.equal({});
      });

      it('Should enable one controller and override main config', () => {

        const controllers: any[] = [{
          controllerInfo: { classInstance: {}, prefix: '', methods: [{ name: 'create' }] },
          methods: [{ httpPath: '/test/:id/test/:name', httpMethod: HttpMethod.POST, name: 'create' }]
        }];

        getControllerSwagger.returns({ enable: true });

        const openApiSchema = new OpenApiSchema(controllers, {
          enableAll: false
        });

        expect(openApiSchema.paths).to.deep.nested.include({
          '/test/{id}/test/{name}.post.tags': ['base']
        });
      });

      it('Should enable one method controller and override main config & controller', () => {

        const controllers: any[] = [{
          controllerInfo: { classInstance: {}, prefix: '', methods: [{ name: 'create' }] },
          methods: [{ httpPath: '/test/:id/test/:name', httpMethod: HttpMethod.POST, name: 'create' }]
        }];

        getControllerSwagger.returns({ enable: false });
        getControllerMethodSwagger.returns({ enable: true });

        const openApiSchema = new OpenApiSchema(controllers, {
          enableAll: false
        });

        expect(openApiSchema.paths).to.deep.nested.include({
          '/test/{id}/test/{name}.post.tags': ['base']
        });
      });
    });
  });

});
