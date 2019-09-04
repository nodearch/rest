import Joi from '@hapi/joi';
import * as metadata from '../metadata';

export function Validate(validationSchema: Joi.ObjectSchema): MethodDecorator {
  return <MethodDecorator> function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    metadata.controller.setMethodValidationSchema(target, propertyKey, validationSchema);

    return descriptor;
  };
}
