import { IDataType, IPropertyRule } from '../interfaces';

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

  setConstraints(constraints: IPropertyRule[]) {
    for (const constraint of constraints) {
      switch (constraint.name) {
        case 'required':
          this.required = <boolean> constraint.value;
          break;

        case 'default':
          if (typeof constraint.value === 'boolean') {
            this.default = constraint.value;
          }
          break;

        case 'description':
          this.description = <string> constraint.value;
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
      }
    }
  }
}
