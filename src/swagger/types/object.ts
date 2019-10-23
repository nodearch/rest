import { IDataType, IObjectType, PropertyRule, SchemaProperties } from '../index';
import { OpenApiSchema } from '../open-api-schema';
import Joi from '@hapi/joi';

export class ObjectType implements IDataType, IObjectType {

  public type: string;
  public properties?: SchemaProperties;
  public maxProperties?: number;
  public minProperties?: number;
  public default?: any;
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

  setConstraints(constraints: PropertyRule[]) {
    for (const constraint of constraints) {

      switch (constraint.name) {
        case 'max':
          this.maxProperties = typeof constraint.value === 'number' ? constraint.value : 0;
          break;

        case 'min':
          this.minProperties = typeof constraint.value === 'number' ? constraint.value : 0;
          break;

        case 'required':
          this.required = typeof constraint.value === 'boolean' ? constraint.value : false;
          break;

        case 'default':
          this.default = typeof constraint.value === 'object' ? constraint.value : {};
          break;

        case 'description':
          this.description = typeof constraint.value === 'string' ? constraint.value : '';
          break;

        case 'examples':
          if (Array.isArray(constraint.value) && typeof constraint.value[0] === 'object') {
              this.example = constraint.value[0];
          }
          break;

        case 'enum':
          if (Array.isArray(constraint.value)) {
            this.enum = constraint.value;
          }
          break;
        default:
          break;
      }
    }
  }
}
