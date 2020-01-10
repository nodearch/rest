import { IDataType, IPropertyRule, JsonSchema } from '../interfaces';
import { OpenApiSchema } from '../open-api-schema';
import Joi from '@hapi/joi';

export class ArrayType implements IDataType {

  public type: string;
  public items: JsonSchema;
  public maxItems?: number;
  public minItems?: number;
  public default?: any[];
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
          this.maxItems = <number> constraint.value;
          break;

        case 'min':
          this.minItems = <number> constraint.value;
          break;

        case 'required':
          this.required = <boolean> constraint.value;
          break;

        case 'default':
          if (Array.isArray(constraint.value)) {
            this.default = constraint.value;
          }
          break;

        case 'description':
          this.description = <string> constraint.value;
          break;

        case 'examples':
          if (Array.isArray(constraint.value) && Array.isArray(constraint.value[0])) {
              this.example = constraint.value[0];
          }
          break;

        case 'unique':
          this.uniqueItems = true;
          break;
      }
    }
  }

}
