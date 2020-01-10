import { ApiKeyIn } from '../enums';

export interface ISwaggerOptions {
  info?: ISwaggerAppInfo;
  servers?: ISwaggerAPIServer[];
  basePath?: string;
  schemes?: string[];
  enableAll?: boolean;
  security?: ISwaggerSecurityOptions;
}

export interface ISwaggerSecurityOptions {
  applyForAll?: boolean;
  definitions?: ISwaggerSecurityConfig;
}

export interface ISwaggerSecurityConfig {
  basicAuth?: boolean;
  apiKeysAuth?: { key: string, in?: ApiKeyIn }[];
}

export interface ISwaggerConfig {
  path: string;
  options?: ISwaggerOptions;
}

export interface ISwaggerTagConfig {
  description?: string;
  externalDocs?: {
    description: string,
    url: string
  };
}

export interface ISwaggerTag extends ISwaggerTagConfig {
  name: string;
}

export interface ISwaggerAppInfo {
  description?: string;
  version?: string;
  title?: string;
  contact?: {
    email: string
  };
}

export interface ISwaggerAPIServer {
  url: string;
  description?: string;
}

export interface ISwaggerSecurityDefinitions {
  [key: string]: {
    type: string,
    name?: string,
    in?: string
  };
}

export interface IHttpResponseSchema {
  status: number;
  description?: string;
  isArray?: boolean;
  schema?: JsonSchema;
}

export interface ISwagger {
  enable?: boolean;
  summary?: string;
  tag?: ISwaggerTagConfig;
  responses?: IHttpResponseSchema[];
  securityDefinitions?: ISwaggerSecurityKeys;
}

export interface ISwaggerSecurityKeys {
  basicAuth?: boolean;
  apiKeysAuth?: string[];
}

export interface ISchemaProperties {
  [key: string]: JsonSchema;
}

export type JsonSchema = IStringSchema | IBooleanSchema | INumberSchema | IObjectSchema | IArraySchema;

export interface IJsonSchemaBase {
  type?: string;
  description?: string;
  example?: any;
  default?: any;
  required?: boolean;
  enum?: any[];
  [key: string]: any;
}

export interface IStringSchema extends IJsonSchemaBase {
  example?: string;
  default?: string;
  required?: boolean;
  format?: string;
  pattern?: string;
  enum?: string[];
  maxLength?: number;
  minLength?: number;
}

export interface IBooleanSchema extends IJsonSchemaBase {
  example?: boolean;
  default?: boolean;
  required?: boolean;
  enum?: boolean[];
}

export interface INumberSchema extends IJsonSchemaBase {
  example?: number;
  default?: number;
  required?: boolean;
  maximum?: number;
  minimum?: number;
  enum?: number[];
}

export interface IObjectSchema extends IJsonSchemaBase {
  properties?: ISchemaProperties;
  example?: object;
  default?: object;
  required?: boolean;
  maxProperties?: number;
  minProperties?: number;
  enum?: object[];
}

export interface IArraySchema extends IJsonSchemaBase {
  items?: JsonSchema;
  example?: any[];
  default?: any[];
  required?: boolean;
  maxItems?: number;
  minItems?: number;
  enum?: any[][];
}

export interface IParsedUrl {
  fullPath: string;
  pathParams: string[];
}

export interface IPathsUrlParams {
  [key: string]: IParsedUrl;
}

export interface IAction {
  tags: string[];
  parameters: IParameter[];
  operationId: string;
  security: IActionSecurity[];
  summary?: string;
  requestBody?: { required?: boolean, content: { [key: string]: { schema: { $ref: string } | JsonSchema } } };
  responses?: {
    [key: number]: {
      description?: string,
      content?: { [key: string]: { schema: { $ref: string } | { type: string, items: { $ref: string } } } }
    }
  };
}

export interface IActionSecurity { [key: string]: []; }

export interface IParameter {
  name: string;
  in: string;
  type: string;
  required: boolean;
}

export interface IParametersList {
  [key: string]: IParameter;
}

export interface IPaths {
  [key: string]: {
    [key: string]: IAction
  };
}

export interface IComponents {
  schemas: {
    [key: string]: JsonSchema
  };
}
