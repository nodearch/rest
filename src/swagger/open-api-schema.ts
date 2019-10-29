import * as metadata from '../metadata';
import { ControllerInfo } from '@nodearch/core';
import Joi from '@hapi/joi';
import path from 'path';
import { fs } from '@nodearch/core';
import { ObjectType, ArrayType, NumberType, BoolType, StringType } from './types';
import { IFileUpload } from '../interfaces';
import { ValidationSchema } from '../validation';
import {
  ISwaggerAPIServer, ISwaggerAppInfo, ISwaggerOptions, IParsedUrl,
  IHttpResponseSchema, JsonSchema, IPropertyRule
} from './interfaces';

export class OpenApiSchema {

  public readonly openapi: string = '3.0.0';
  public readonly servers: ISwaggerAPIServer[] = [];
  public readonly info: ISwaggerAppInfo = {};
  public readonly components: any = { schemas: {} };
  public readonly paths: any = {};

  constructor(controllers: ControllerInfo[], swaggerOptions?: ISwaggerOptions, joiOptions?: Joi.ValidationOptions) {

    if (swaggerOptions) {
      this.servers = swaggerOptions.servers || [];
      this.info = swaggerOptions.info || {};
    }

    const pathsUrlParams: { [key: string]: IParsedUrl } = {};

    for (const controller of controllers) {
      for (const method of controller.methods) {

        const schema: ValidationSchema = metadata.controller.getMethodValidationSchema(controller.classInstance, method.name);
        const httpMethod = metadata.controller.getMethodHTTPMethod(controller.classInstance, method.name);
        const httpPath = metadata.controller.getMethodHTTPPath(controller.classInstance, method.name);
        const httpResponses: IHttpResponseSchema[] = metadata.controller.getMethodHttpResponses(controller.classInstance, method.name);
        const filesUpload: IFileUpload[] = metadata.controller.getMethodFileUpload(controller.classInstance, method.name);
        const fullHttpPath = path.join(`/${controller.prefix}` || '', httpPath);
        const urlWithParams = pathsUrlParams[fullHttpPath] || this.getUrlWithParams(fullHttpPath);
        const action: any = { tags: [ controller.prefix ], operationId: `${httpMethod}-${controller.prefix}`, parameters: [] };
        const presence = joiOptions && joiOptions.presence ? joiOptions.presence : 'required';

        this.setRequestParams(action, urlWithParams.pathParams, presence, schema) ;
        this.setRequestBody(action, presence, schema, filesUpload);
        this.setResponses(action, httpResponses);

        if (this.paths[urlWithParams.fullPath]) {
          this.paths[urlWithParams.fullPath][httpMethod] = action;
        }
        else {
          this.paths[urlWithParams.fullPath] = { [httpMethod]: action };
        }
      }
    }
  }

  private setRequestParams(action: any, urlParams: string[], presence: string, schema?: ValidationSchema) {

    const urlParamsRules: { [key: string]: object } = {};

    if (schema) {
      if (schema.headers) {
        const headersSchema = OpenApiSchema.parseTypes(schema.headers.describe(), presence);

        for (const header in headersSchema.properties) {
          action.parameters.push(Object.assign({ name: header, in: 'header' }, headersSchema.properties[header]));
        }
      }

      if (schema.query) {
        const querySchema = OpenApiSchema.parseTypes(schema.query.describe(), presence);

        for (const query in querySchema.properties) {
          action.parameters.push(Object.assign({ name: query, in: 'query' }, querySchema.properties[query]));
        }
      }

      if (schema.params) {
        const paramsSchema = OpenApiSchema.parseTypes(schema.params.describe(), presence);

        for (const param in paramsSchema.properties) {
          urlParamsRules[param] = paramsSchema.properties[param];
        }
      }
    }

    if (urlParams) {
      for (const param of urlParams) {
        const paramConfig = Object.assign(urlParamsRules[param] || {}, { name: param, in: 'path', type: 'string', required: true });
        action.parameters = [paramConfig].concat(action.parameters);
      }
    }
  }

  private setRequestBody(action: any, presence: string, schema?: ValidationSchema, files?: IFileUpload[]) {

    if (files && files.length > 0) {

      const schemaBody: JsonSchema = schema && schema.body ?
        OpenApiSchema.parseTypes(schema.body.describe(), presence) :
        { type: 'object', properties: {} };

      schemaBody.properties = schemaBody.properties || {};

      for (const file of files) {
        schemaBody.properties[file.name] =  Object.assign(
          schemaBody[file.name] || {},
          file.maxCount && file.maxCount > 1 ?
            { type: 'array', items: { type: 'string', format: 'binary' }, maxItems: file.maxCount} : { type: 'string', format: 'binary' }
        );
      }

      delete schemaBody.required;
      action.requestBody = { content: { 'multipart/form-data': { schema: schemaBody } } };
    }
    else if (schema && schema.body) {

      const definitionKey = `${action.operationId}-body`;
      const bodySchema = OpenApiSchema.parseTypes(schema.body.describe(), presence);
      this.components.schemas[definitionKey] = bodySchema;
      const { required } = bodySchema;
      const contentType = bodySchema.type && !['array', 'object'].includes(bodySchema.type) ? 'text/plain' : 'application/json';

      action.requestBody = { required, content: { [contentType]: { schema: { $ref: `#/components/schemas/${definitionKey}` } } } };
    }
  }

  private setResponses(action: any, httpResponses?: IHttpResponseSchema[]) {
    action.responses = {};

    if (httpResponses) {
      for (const httpRes of httpResponses) {
        action.responses[httpRes.status] = { description: httpRes.description || '' };

        if (httpRes.schema) {
          const definitionKey = `${action.operationId}-response`;
          this.components.schemas[definitionKey] = httpRes.schema;
          const contentType = httpRes.schema.type && !['array', 'object'].includes(httpRes.schema.type) ? 'text/plain' : 'application/json';

          action.responses[httpRes.status].content = {
            [contentType]: httpRes.isArray ?
              { schema: { type: 'array', items: { $ref: `#/components/schemas/${definitionKey}` } } } :
              { schema: { $ref: `#/components/schemas/${definitionKey}` } }
          };
        }
      }
    }
    else {
      action.responses[200] = { description: '' };
    }

  }

  private getUrlWithParams(url: string): IParsedUrl {

    const pathParams: string[] = [];
    let fullPath: string = '';

    for (const urlPart of url.split('/')) {
      if (urlPart !== '') {
        if (urlPart.startsWith(':')) {

          const pathParam: string = urlPart.substring(1);
          pathParams.push(pathParam);
          fullPath = `${fullPath}/{${pathParam}}`;
        }
        else {

          fullPath = `${fullPath}/${urlPart}`;
        }
      }
    }
    return { fullPath, pathParams };
  }

  public static parseTypes(propertySchema: Joi.Description, presence: string): JsonSchema {

    switch (propertySchema.type) {

      case 'object':
        return new ObjectType(presence, propertySchema.keys, this.getSchemaRules(propertySchema, presence));

      case 'array':
        return new ArrayType(presence, propertySchema.items, this.getSchemaRules(propertySchema, presence));

      case 'number':
        return new NumberType(this.getSchemaRules(propertySchema, presence));

      case 'string':
      case 'binary':
      case 'date':
        return new StringType(propertySchema.type, this.getSchemaRules(propertySchema, presence));

      case 'boolean':
          return new BoolType(this.getSchemaRules(propertySchema, presence));

      default:
        return {};
    }
  }

  public static getSchemaRules(schema: any, presence: string): IPropertyRule[] {

    const rules: IPropertyRule[] = [];

    if (schema.flags) {
      if (schema.flags.default) {
        rules.push({ name: 'default', value: schema.flags.default });
      }

      if (schema.flags.description) {
        rules.push({ name: 'description', value: schema.flags.description });
      }

      if (schema.flags.encoding) {
        rules.push({ name: 'format', value: schema.flags.encoding });
      }

      if (schema.flags.format) {
        rules.push({ name: 'format', value: schema.flags.format });
      }
    }

    if (schema.flags && schema.flags.presence) {
      rules.push({ name: 'required', value: schema.flags.presence === 'required' ? true : false  });
    }
    else {
      rules.push({ name: 'required', value: presence === 'required' ? true : false });
    }

    if (schema.examples) {
      rules.push({ name: 'examples', value: schema.examples });
    }

    if (schema.allow) {
      rules.push({ name: 'enum', value: schema.allow });
    }

    if (schema.rules) {
      for (const schemaRule of schema.rules) {
        rules.push({ name: schemaRule.name, value: schemaRule.args ? (schemaRule.args.limit || schemaRule.args.regex) : null });
      }
    }

    return rules;
  }

  public async writeOpenAPI(dir: string): Promise<void> {
    await fs.writeFile(path.join(dir, 'swagger.json'), JSON.stringify(this));
  }

}
