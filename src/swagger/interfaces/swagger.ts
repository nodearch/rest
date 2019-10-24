export interface SwaggerOptions {
  info?: SwaggerAppInfo;
  servers?: SwaggerAPIServer[];
  basePath?: string;
  schemes?: string[];
}

export interface SwaggerConfig {
  enable: boolean;
  options?: SwaggerOptions;
}

export interface SwaggerAppInfo {
  description?: string;
  version?: string;
  title?: string;
  contact?: {
    email: string
  };
}

export interface SwaggerAPIServer {
  url: string;
  description?: string;
}

export interface HttpResponse {
  status: number;
  description?: string;
  isArray?: boolean;
  schema?: JsonSchema;
}

export interface SchemaProperties {
  [key: string]: JsonSchema;
}

export type JsonSchema = StringSchema | BooleanSchema | NumberSchema | ObjectSchema | ArraySchema;

export interface JsonSchemaBase {
  type?: string;
  description?: string;
  example?: any;
  default?: any;
  required?: boolean;
  enum?: any[];
  [key: string]: any;
}

export interface StringSchema extends JsonSchemaBase {
  example?: string;
  default?: string;
  required?: boolean;
  format?: string;
  pattern?: string;
  enum?: string[];
  maxLength?: number;
  minLength?: number;
}

export interface BooleanSchema extends JsonSchemaBase {
  example?: boolean;
  default?: boolean;
  required?: boolean;
  enum?: boolean[];
}

export interface NumberSchema extends JsonSchemaBase {
  example?: number;
  default?: number;
  required?: boolean;
  maximum?: number;
  minimum?: number;
  enum?: number[];
}

export interface ObjectSchema extends JsonSchemaBase {
  properties?: SchemaProperties;
  example?: object;
  default?: object;
  required?: boolean;
  maxProperties?: number;
  minProperties?: number;
  enum?: object[];
}

export interface ArraySchema extends JsonSchemaBase {
  items?: JsonSchema;
  example?: any[];
  default?: any[];
  required?: boolean;
  maxItems?: number;
  minItems?: number;
  enum?: any[][];
}

export interface ParsedUrl {
  fullPath: string;
  pathParams: string[];
}
