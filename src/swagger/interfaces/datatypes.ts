import { ISchemaProperties, IJsonSchemaBase } from './swagger';

export interface IPropertyRule {
  name: string;
  value: string | boolean | number | object | any[] | null;
}

export interface INestedProperty {
  key: string;
  schema: any;
}

export interface IDataType extends IJsonSchemaBase {
  setConstraints(constraints: IPropertyRule[]): void;
}

export interface IObjectType {
  properties?: ISchemaProperties;
  setNestedProperties(properties: INestedProperty[], presence: string): void;
}
