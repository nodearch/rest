import Joi from '@hapi/joi';
import * as metadata from '../metadata';
import { ValidationSchema } from '../validation';

export function Validate(validationSchema: ValidationSchema): MethodDecorator {
  return <MethodDecorator> function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    metadata.controller.setMethodValidationSchema(target, propertyKey, validationSchema);

    return descriptor;
  };
}
