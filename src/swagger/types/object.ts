import { IDataType, IObjectType, IPropertyRule, ISchemaProperties } from '../interfaces';
import { OpenApiSchema } from '../open-api-schema';
import Joi from '@hapi/joi';

export class ObjectType implements IDataType, IObjectType {

  public type: string;
  public properties?: ISchemaProperties;
  public maxProperties?: number;
  public minProperties?: number;
  public default?: object;
  public required?: boolean;
  public example?: object;
  public description?: string;
  public enum?: object[];

  constructor(presence: string, properties?: Joi.Description, constraints?: any[]) {
    this.type = 'object';

    if (properties) {
      this.setNestedProperties(properties, presence);
    }

    if (constraints) {
      this.setConstraints(constraints);
    }
  }

  setNestedProperties(properties: Joi.Description, presence: string) {
    this.properties = {};
    for (const key in properties) {
      this.properties[key] = OpenApiSchema.parseTypes(properties[key], presence);
    }
  }

  setConstraints(constraints: IPropertyRule[]) {
    for (const constraint of constraints) {
      switch (constraint.name) {
        case 'max':
          this.maxProperties = <number> constraint.value;
          break;

        case 'min':
          this.minProperties = <number> constraint.value;
          break;

        case 'required':
          this.required = <boolean> constraint.value;
          break;

        case 'default':
          if (typeof constraint.value === 'object') {
            this.default = <object> constraint.value;
          }
          break;

        case 'description':
          this.description = <string> constraint.value;
          break;

        case 'examples':
          if (Array.isArray(constraint.value) && typeof constraint.value[0] === 'object') {
              this.example = constraint.value[0];
          }
          break;
      }
    }
  }
}
