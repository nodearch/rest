import Joi from '@hapi/joi';
import * as metadata from '../metadata';
import { IValidationSchema } from '../validation';

export function Validate(validationSchema: IValidationSchema): MethodDecorator {
  return <MethodDecorator> function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    metadata.controller.setMethodValidationSchema(target, propertyKey, validationSchema);

    return descriptor;
  };
}
