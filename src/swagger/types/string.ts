import { IDataType, IPropertyRule } from '../interfaces';

export class StringType implements IDataType {

  public type: string;
  public maxLength?: number;
  public minLength?: number;
  public default?: string;
  public required?: boolean;
  public example?: string;
  public description?: string;
  public enum?: string[];
  public format?: string;
  public pattern?: string;

  constructor(type: string, constraints?: any[]) {
    this.type = 'string';

    if (constraints) {
      this.setConstraints(constraints);
    }

    this.setFormat(type);
  }

  setConstraints(constraints: IPropertyRule[]) {
    for (const constraint of constraints) {

      switch (constraint.name) {
        case 'max':
          this.maxLength = typeof constraint.value === 'number' ? constraint.value : 0;
          break;

        case 'min':
          this.minLength = typeof constraint.value === 'number' ? constraint.value : 0;
          break;

        case 'required':
          this.required = typeof constraint.value === 'boolean' ? constraint.value : false;
          break;

        case 'default':
          this.default = typeof constraint.value === 'string' ? constraint.value : '';
          break;

        case 'description':
          this.description = typeof constraint.value === 'string' ? constraint.value : '';
          break;

        case 'examples':
          if (Array.isArray(constraint.value) && typeof constraint.value[0] === 'string') {
             this.example = constraint.value[0];
          }
          break;

        case 'enum':
          if (Array.isArray(constraint.value)) {
            this.enum = constraint.value;
          }
          break;

        case 'pattern':
          if (typeof constraint.value === 'string') {
            this.pattern = constraint.value;
          }
          break;

        case 'format':
        default:
          this.setFormat(null, constraint);
          break;
      }
    }
  }

  setFormat(type?: string | null, format?: IPropertyRule | null) {

    const mapFormats: any = { dataUri: 'uri', base64: 'byte', email: 'email', guid: 'uuid', hostname: 'hostname' };

    if (type) {
      if (type === 'binary') {
        if (this.format === 'base64') {
          this.format = 'byte';
        }
        else {
          this.format = 'binary';
        }
      }
      else if (type === 'date') {
        this.format = 'date';
      }
    }
    else if (format) {
      if (mapFormats[format.name]) {
        this.format = mapFormats[format.name];
      }
    }
  }
}
