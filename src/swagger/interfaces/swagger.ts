export interface ISwaggerOptions {
  info?: ISwaggerAppInfo;
  servers?: ISwaggerAPIServer[];
  basePath?: string;
  schemes?: string[];
  enable?: boolean;
}

export interface ISwaggerConfig {
  path: string;
  options?: ISwaggerOptions;
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

export interface IHttpResponseSchema {
  status: number;
  description?: string;
  isArray?: boolean;
  schema?: JsonSchema;
}

export interface ISwagger {
  enable?: boolean;
  description?: string;
  responses?: IHttpResponseSchema[];
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
  requestBody?: { required?: boolean, content: { [key: string]: { schema: { $ref: string } | JsonSchema } } };
  responses?: {
    [key: number]: {
      description?: string,
      content?: { [key: string]: { schema: { $ref: string } | { type: string, items: { $ref: string } } } }
    }
  };
}

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
