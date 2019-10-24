import { describe, it } from 'mocha';
import { expect } from 'chai';
import { stub, SinonStub } from 'sinon';
import { OpenApiSchema } from './open-api-schema';
import * as metadata from '../metadata';
import { HttpMethod } from '../enums';
import Joi from '@hapi/joi';

describe('swagger/open-api-schema', () => {

  let getMethodHTTPMethod: SinonStub, getMethodHTTPPath: SinonStub, getMethodValidationSchema: SinonStub,
    getMethodHttpResponses: SinonStub, getMethodFileUpload: SinonStub;

  beforeEach(() => {
    getMethodHTTPMethod = stub(metadata.controller, 'getMethodHTTPMethod').returns(HttpMethod.GET);
    getMethodHTTPPath = stub(metadata.controller, 'getMethodHTTPPath').returns('/');
    getMethodValidationSchema = stub(metadata.controller, 'getMethodValidationSchema').returns({});
    getMethodHttpResponses = stub(metadata.controller, 'getMethodHttpResponses').returns([]);
    getMethodFileUpload = stub(metadata.controller, 'getMethodFileUpload').returns([]);
  });

  afterEach(() => {
    getMethodHTTPMethod.restore();
    getMethodHTTPPath.restore();
    getMethodValidationSchema.restore();
    getMethodHttpResponses.restore();
    getMethodFileUpload.restore();
  });

  describe('OpenApiSchema', () => {

    describe('One Controller One End Point', () => {
      it('no joi or swagger options or no response schema', () => {

        const controllers: any[] = [{ classInstance: {}, prefix: 'controller1', methods: [{ name: 'find' }] }];

        const openApiSchema = new OpenApiSchema(controllers);
        expect(openApiSchema).to.deep.equals({
          openapi: '3.0.0', servers: [], info: {}, components: { schemas: {} },
          paths: {
            '/controller1': {
              get: { tags: ['controller1'], operationId: 'get-controller1', parameters: [], responses: {} }
            }
          }
        });
      });

      it('with joi but swagger options or no response schema', () => {

        const controllers: any[] = [{ classInstance: {}, prefix: 'controller1', methods: [{ name: 'create' }] }];
        getMethodHTTPMethod.returns(HttpMethod.POST);
        getMethodHTTPPath.returns('/test/:id/test/:name');
        getMethodValidationSchema.returns({
          body: Joi.object().keys({ name: Joi.string().required(), age: Joi.number().optional() }),
          params: Joi.object().keys({ name: Joi.string().pattern(/^./).optional() })
        });

        const openApiSchema = new OpenApiSchema(controllers);

        expect(openApiSchema.components).to.deep.equals( {
          schemas: {
            'post-controller1-body': {
              type: 'object',
              properties: {  name: { type: 'string', required: true }, age: { type: 'number', required: false } }
            }
          }
        });

        expect(openApiSchema.paths).to.deep.nested.include({
          '/controller1/test/{id}/test/{name}.post.tags': ['controller1'],
          '/controller1/test/{id}/test/{name}.post.operationId': 'post-controller1',
          '/controller1/test/{id}/test/{name}.post.parameters': [
            { type: 'string', required: true, pattern: '/^./', name: 'name', in: 'path' },
            { name: 'id', in: 'path', type: 'string', required: true }
          ],
        });
      });

      it('with joi & swagger options but no response schema', () => {

        const controllers: any[] = [{ classInstance: {}, prefix: 'controller2', methods: [{ name: 'update' }] }];
        getMethodHTTPMethod.returns(HttpMethod.PUT);
        getMethodHTTPPath.returns('/test/:id/test');
        getMethodValidationSchema.returns({
          body: Joi.object().keys({
            id: Joi.string().guid().max(7).required().example(2),
            limit: Joi.number().min(4).optional(),
            enable: Joi.boolean().default(true).example(false).valid(true).description('Enable'),
            dates: Joi.array().items(Joi.date()).default(['11-11-1991', '12-01-1999']).min(1).max(10).description('the tags')
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
                  type: 'array', description: 'the tags', items: { type: 'string', format: 'date' },
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

      it('with joi & swagger options & response schema & file upload', () => {

        const controllers: any[] = [{ classInstance: {}, prefix: 'controller2', methods: [{ name: 'update' }] }];
        const responsesSchema = [{
            status: 200, schema: {
              type: 'object', required: true,
              properties: { id: { type: 'integer', format: 'int64' }, name: { type: 'string' }, tag: { type: 'string' } }
            }, description: 'Test description'
          }, { status: 400, description: 'Test Error description2' }, { status: 500 }
        ];
        getMethodHTTPMethod.returns(HttpMethod.PUT);
        getMethodHTTPPath.returns('/test/:id/test');
        getMethodHttpResponses.returns(responsesSchema);
        getMethodFileUpload.returns([{ name: 'file1' }, { name: 'file2', maxCount: 3 }]);
        getMethodValidationSchema.returns({
          body: Joi.object().keys({
            id: Joi.string().guid().max(7).required().example(2).description('Id')
              .valid('OOII-YJKK', 'OOII-IOPQ', 'OOII-H0UK'),
            data: Joi.object().keys({
              likes: Joi.array().items(Joi.object().keys({
                date: Joi.date().example('11-11-1991').required(),
                times: Joi.array().items(Joi.number().integer().valid(1, 2))
              })).unique().example([]),
            key: Joi.string().base64(),
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
                  key: { type: 'string', format: 'byte' },
                  url: { type: 'string', format: 'uri', example: 'http://test.com' },
                  likes: {
                    type: 'array', example: [], uniqueItems: true,
                    items: {
                      type: 'object',
                      properties: {
                        date: { type: 'string', required: true,  example: '11-11-1991', format: 'date' },
                        times: { type: 'array', items: { type: 'integer', enum: [1, 2], required: false } }
                      }
                    }
                  }
                }
              },
              binaryFile: { type: 'string', format: 'binary', required: false },
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

      it('text request & text response', () => {

        const controllers: any[] = [{ classInstance: {}, prefix: 'controller1', methods: [{ name: 'find' }] }];
        const responsesSchema = [{
            status: 200, isArray: true, schema: {
              type: 'string', required: true,
            }, description: 'Test description'
          }, { status: 400, description: 'Test Error description2' }
        ];
        getMethodHTTPPath.returns('/test/:id/test/:name');
        getMethodHttpResponses.returns(responsesSchema);
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

    });

  });

});
