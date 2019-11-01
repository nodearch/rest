import * as metadata from '../metadata';
import { IValidationSchema } from './validation-schema.interface';

export function Validate(validationSchema: IValidationSchema): MethodDecorator {
  return <MethodDecorator> function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    metadata.controller.setMethodValidationSchema(target, propertyKey, validationSchema);

    return descriptor;
  };
}
