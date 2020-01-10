import { IDataType, IPropertyRule } from '../interfaces';

export class NumberType implements IDataType {

  public type: string;
  public maximum?: number;
  public minimum?: number;
  public default?: number;
  public required?: boolean;
  public example?: number;
  public description?: string;
  public enum?: number[];

  constructor( constraints?: any[]) {
    this.type = 'number';

    if (constraints) {
      this.setConstraints(constraints);
    }
  }

  setConstraints(constraints: IPropertyRule[]) {
    for (const constraint of constraints) {
      switch (constraint.name) {
        case 'max':
          this.maximum = <number> constraint.value;
          break;

        case 'min':
          this.minimum = <number> constraint.value;
          break;

        case 'required':
          this.required = <boolean> constraint.value;
          break;

        case 'default':
          if (typeof constraint.value === 'number') {
            this.default = constraint.value;
          }
          break;

        case 'description':
          this.description = <string> constraint.value;
          break;

        case 'examples':
          if (Array.isArray(constraint.value) && typeof constraint.value[0] === 'number') {
              this.example = constraint.value[0];
          }
          break;

        case 'enum':
          if (Array.isArray(constraint.value)) {
            this.enum = constraint.value;
          }
          break;

        case 'integer':
          this.type = 'integer';
          break;
      }
    }
  }
}
