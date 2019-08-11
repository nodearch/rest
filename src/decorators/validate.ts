import { METADATA_KEY } from '../constants';
import Joi from '@hapi/joi'; 
import { common } from '../metadata';


export function Validate (validationSchema: Joi.ObjectSchema): MethodDecorator {
  return <MethodDecorator>function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    common.setMethodMetadata(METADATA_KEY.ARCH_VALIDATION_SCHEMA, target, propertyKey, validationSchema);
    
    return descriptor;
  }
}