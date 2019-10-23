import { IDataType, PropertyRule } from '../index';

export class BoolType implements IDataType {

  public type: string;
  public default?: boolean;
  public required?: boolean;
  public example?: boolean;
  public description?: string;
  public enum?: boolean[];

  constructor( constraints?: any[]) {
    this.type = 'boolean';

    if (constraints) {
      this.setConstraints(constraints);
    }
  }

  setConstraints(constraints: PropertyRule[]) {
    for (const constraint of constraints) {

      switch (constraint.name) {

        case 'required':
          this.required = typeof constraint.value === 'boolean' ? constraint.value : false;
          break;

        case 'default':
          this.default = typeof constraint.value === 'boolean' ? constraint.value : false;
          break;

        case 'description':
          this.description = typeof constraint.value === 'string' ? constraint.value : '';
          break;

        case 'examples':
          if (Array.isArray(constraint.value) && typeof constraint.value[0] === 'boolean') {
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
