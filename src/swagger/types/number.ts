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
          this.maximum = typeof constraint.value === 'number' ? constraint.value : 0;
          break;

        case 'min':
          this.minimum = typeof constraint.value === 'number' ? constraint.value : 0;
          break;

        case 'required':
          this.required = typeof constraint.value === 'boolean' ? constraint.value : false;
          break;

        case 'default':
          this.default = typeof constraint.value === 'number' ? constraint.value : 0;
          break;

        case 'description':
          this.description = typeof constraint.value === 'string' ? constraint.value : '';
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

        default:
          break;
      }
    }
  }
}
