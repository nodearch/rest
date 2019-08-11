import { METADATA_KEY } from '../constants';
import Joi from '@hapi/joi'; 
import * as metadata from '../metadata';


export function Validate (validationSchema: Joi.ObjectSchema): MethodDecorator {
  return <MethodDecorator>function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    metadata.common.setMethodMetadata(METADATA_KEY.VALIDATION_SCHEMA, target, propertyKey, validationSchema);
    
    return descriptor;
  }
}