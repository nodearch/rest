import { IDataType, IPropertyRule, JsonSchema } from '../interfaces';
import { OpenApiSchema } from '../open-api-schema';
import Joi from '@hapi/joi';

export class ArrayType implements IDataType {

  public type: string;
  public items: JsonSchema;
  public maxItems?: number;
  public minItems?: number;
  public default?: any;
  public required?: boolean;
  public example?: any[];
  public description?: string;
  public enum?: any[][];
  public uniqueItems?: boolean;

  constructor(presence: string, items: Joi.Description[], constraints?: any[]) {
    this.type = 'array';
    this.items = OpenApiSchema.parseTypes(items[0], presence);

    if (constraints) {
      this.setConstraints(constraints);
    }
  }

  setConstraints(constraints: IPropertyRule[]) {
    for (const constraint of constraints) {

      switch (constraint.name) {
        case 'max':
          this.maxItems = typeof constraint.value === 'number' ? constraint.value : 0;
          break;

        case 'min':
          this.minItems = typeof constraint.value === 'number' ? constraint.value : 0;
          break;

        case 'required':
          this.required = typeof constraint.value === 'boolean' ? constraint.value : false;
          break;

        case 'default':
          this.default = typeof constraint.value === 'object' ? constraint.value : [];
          break;

        case 'description':
          this.description = typeof constraint.value === 'string' ? constraint.value : '';
          break;

        case 'examples':
          if (Array.isArray(constraint.value) && Array.isArray(constraint.value[0])) {
              this.example = constraint.value[0];
          }
          break;

        case 'unique':
          this.uniqueItems = true;
          break;

        default:
          break;
      }
    }
  }

}
