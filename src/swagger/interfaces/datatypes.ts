import { SchemaProperties, JsonSchemaBase } from './index';

export interface PropertyRule {
  name: string;
  value: string | boolean | number | object | any[] | null;
}
export interface NestedProperty {
  key: string;
  schema: any;
}

export interface IDataType extends JsonSchemaBase {
  setConstraints(constraints: PropertyRule[]): void;
}

export interface IObjectType {
  properties?: SchemaProperties;
  setNestedProperties(properties: NestedProperty[], presence: string): void;
}
