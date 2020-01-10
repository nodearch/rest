import * as metadata from '../metadata';
import Joi from '@hapi/joi';
import path from 'path';
import { fs } from '@nodearch/core';
import { ObjectType, ArrayType, NumberType, BoolType, StringType } from './types';
import { IFileUpload } from '../fileUpload';
import { IValidationSchema } from '../validation';
import {
  ISwaggerAPIServer, ISwaggerAppInfo, ISwaggerOptions, IParsedUrl, IHttpResponseSchema, IPaths,
  JsonSchema, IPropertyRule, ISwagger, IPathsUrlParams, IAction, IParameter, IParametersList, IComponents,
  ISwaggerSecurityDefinitions, ISwaggerSecurityConfig, ISwaggerSecurityKeys, ISwaggerSecurityOptions, ISwaggerTag
} from './interfaces';
import { RestControllerInfo } from '../controller';

export class OpenApiSchema {
  public readonly openapi: string;
  public readonly servers: ISwaggerAPIServer[];
  public readonly info: ISwaggerAppInfo;
  public readonly components: IComponents;
  public readonly paths: IPaths;
  public readonly securityDefinitions?: ISwaggerSecurityDefinitions;
  public readonly tags: ISwaggerTag[];

  constructor(controllers: RestControllerInfo[], swaggerOptions?: ISwaggerOptions, joiOptions?: Joi.ValidationOptions) {
    this.openapi = '3.0.0';
    this.paths = {};
    this.tags = [];
    this.components = { schemas: {} };

    if (swaggerOptions) {
      this.servers = swaggerOptions.servers || [];
      this.info = swaggerOptions.info || {};

      if (swaggerOptions.security?.definitions) {
        this.securityDefinitions = this.getSecurityDefinitions(swaggerOptions.security.definitions);
      }
    }
    else {
      this.servers = [];
      this.info = {};
    }

    this.init(controllers, swaggerOptions || {}, joiOptions);
  }

  private init(controllers: RestControllerInfo[], swaggerOptions: ISwaggerOptions, joiOptions?: Joi.ValidationOptions): void {
    const pathsUrlParams: IPathsUrlParams = {};

    for (const controller of controllers) {
      const tagName: string = controller.controllerInfo.prefix || 'base';
      const swaggerCtrlConfig: ISwagger = metadata.controller.getControllerSwagger(controller.controllerInfo.classInstance);
      this.tags.push(Object.assign({ name: tagName }, swaggerCtrlConfig ? swaggerCtrlConfig.tag : {}));

      for (const method of controller.methods) {
        const swaggerMethodConfig: ISwagger = metadata.controller.getControllerMethodSwagger(controller.controllerInfo.classInstance, method.name);

        if (this.isAllowed(swaggerMethodConfig, swaggerCtrlConfig, swaggerOptions)) {
          const schema: IValidationSchema = metadata.controller.getMethodValidationSchema(controller.controllerInfo.classInstance, method.name);
          const filesUpload: IFileUpload[] = metadata.controller.getMethodFileUpload(controller.controllerInfo.classInstance, method.name);
          pathsUrlParams[method.httpPath] = pathsUrlParams[method.httpPath] || this.getUrlWithParams(method.httpPath);
          const urlWithParams: IParsedUrl = pathsUrlParams[method.httpPath];
          const presence: Joi.PresenceMode = joiOptions && joiOptions.presence ? joiOptions.presence : 'required';
          const action: IAction = {
            tags: [ tagName ], parameters: [], security: [],
            operationId: `${method.httpMethod}${controller.controllerInfo.prefix ? `-${controller.controllerInfo.prefix}` : ''}`
          };

          this.setSummary(action, swaggerMethodConfig, swaggerCtrlConfig);
          this.setRequestParams(action, urlWithParams.pathParams, presence, schema) ;
          this.setRequestBody(action, presence, schema, filesUpload);
          this.setResponses(action, swaggerMethodConfig.responses);
          this.setSecurity(action, swaggerMethodConfig, swaggerCtrlConfig, swaggerOptions.security);

          if (this.paths[urlWithParams.fullPath]) {
            this.paths[urlWithParams.fullPath][method.httpMethod] = action;
          }
          else {
            this.paths[urlWithParams.fullPath] = { [method.httpMethod]: action };
          }
        }
      }
    }
  }

  private isAllowed(methodConfig?: ISwagger, ctrlConfig?: ISwagger, swaggerOptions?: ISwaggerOptions): boolean {
    let availableForSwagger = swaggerOptions?.hasOwnProperty('enableAllRoutes') ? <boolean> swaggerOptions.enableAllRoutes : true;
    availableForSwagger = ctrlConfig?.hasOwnProperty('enable') ? <boolean> ctrlConfig.enable : availableForSwagger;
    availableForSwagger = methodConfig?.hasOwnProperty('enable') ? <boolean> methodConfig.enable : availableForSwagger;

    return availableForSwagger;
  }

  private setSummary(action: IAction, methodConfig?: ISwagger, ctrlConfig?: ISwagger): void {
    if (methodConfig?.summary) {
      action.summary = methodConfig.summary;
    }
    else if (ctrlConfig?.summary){
      action.summary = ctrlConfig.summary;
    }
  }

  private setRequestParams(action: IAction, urlParams: string[], presence: string, schema?: IValidationSchema): void {
    const urlParamsRules: IParametersList = {};

    if (schema) {
      if (schema.headers) {
        const headersSchema: JsonSchema = OpenApiSchema.parseTypes(schema.headers.describe(), presence);

        for (const header in headersSchema.properties) {
          action.parameters.push(Object.assign({ name: header, in: 'header' }, headersSchema.properties[header]));
        }
      }

      if (schema.query) {
        const querySchema: JsonSchema = OpenApiSchema.parseTypes(schema.query.describe(), presence);

        for (const query in querySchema.properties) {
          action.parameters.push(Object.assign({ name: query, in: 'query' }, querySchema.properties[query]));
        }
      }

      if (schema.params) {
        const paramsSchema: JsonSchema = OpenApiSchema.parseTypes(schema.params.describe(), presence);

        for (const param in paramsSchema.properties) {
          urlParamsRules[param] = paramsSchema.properties[param];
        }
      }
    }

    if (urlParams) {
      for (const param of urlParams) {
        const paramConfig: IParameter = Object.assign(urlParamsRules[param] || {}, { name: param, in: 'path', type: 'string', required: true });
        action.parameters = [paramConfig].concat(action.parameters);
      }
    }
  }

  private setRequestBody(action: IAction, presence: string, schema?: IValidationSchema, files?: IFileUpload[]): void {
    if (files?.length) {
      const schemaBody = schema && schema.body ? OpenApiSchema.parseTypes(schema.body.describe(), presence) : { type: 'object', properties: {} };
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
    else if (schema?.body) {
      const definitionKey: string = `${action.operationId}-body`;
      const bodySchema: JsonSchema = OpenApiSchema.parseTypes(schema.body.describe(), presence);
      this.components.schemas[definitionKey] = bodySchema;
      const contentType = bodySchema.type && !['array', 'object'].includes(bodySchema.type) ? 'text/plain' : 'application/json';

      action.requestBody = {
        required: bodySchema.required,
        content: { [contentType]: { schema: { $ref: `#/components/schemas/${definitionKey}` } } }
      };
    }
  }

  private setResponses(action: IAction, httpResponses?: IHttpResponseSchema[]): void {
    action.responses = {};

    if (httpResponses?.length) {
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

  private setSecurity(action: IAction, methodConfig?: ISwagger, ctrlConfig?: ISwagger, securityOptions?: ISwaggerSecurityOptions): void {
    if (methodConfig?.securityDefinitions) {
      this.setValidSecurityKeys(action, methodConfig.securityDefinitions);
    }
    else if (ctrlConfig?.securityDefinitions) {
      this.setValidSecurityKeys(action, ctrlConfig.securityDefinitions);
    }
    else if (securityOptions?.enableAllRoutes && this.securityDefinitions) {
      action.security = action.security.concat(Object.keys(this.securityDefinitions).map(secDef => ({ [secDef]: [] })));
    }
  }

  private setValidSecurityKeys(action: IAction, selectedSecurityKeys: ISwaggerSecurityKeys): void {
    if (this.securityDefinitions) {
      if (selectedSecurityKeys.basicAuth && this.securityDefinitions.basicAuth) {
        action.security.push({ basicAuth: [] });
      }

      if (selectedSecurityKeys.apiKeysAuth) {
        for (const authKey of selectedSecurityKeys.apiKeysAuth) {
          if (this.securityDefinitions[authKey]) {
            action.security.push({ [authKey]: [] });
          }
        }
      }
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

  private getSecurityDefinitions(securityConfig: ISwaggerSecurityConfig): ISwaggerSecurityDefinitions {
    const securityDefinitions: ISwaggerSecurityDefinitions = {};

    if (securityConfig.basicAuth) {
      securityDefinitions.basicAuth = { type: 'basic' };
    }

    if (securityConfig.apiKeysAuth?.length) {
      for (const authKey of securityConfig.apiKeysAuth) {
        securityDefinitions[authKey.key] = {
          name: authKey.key,
          type: 'apiKey',
          in: authKey.in || 'header'
        };
      }
    }

    return securityDefinitions;
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

    if (schema.flags?.presence) {
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
}
