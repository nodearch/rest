import { METADATA_KEY } from '../constants';
import Joi from '@hapi/joi'; 


export function Validate (validationSchema: Joi.ObjectSchema): MethodDecorator {
  return <MethodDecorator>function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    Reflect.defineMetadata(METADATA_KEY.ARCH_VALIDATION_SCHEMA, validationSchema, target, propertyKey);
    return descriptor;
  }
}