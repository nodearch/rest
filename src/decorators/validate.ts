import { METADATA_KEY } from '../constants';


export function Validate (validationSchema: any): MethodDecorator {
  return <MethodDecorator>function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    Reflect.defineMetadata(METADATA_KEY.ARCH_VALIDATION_SCHEMA, validationSchema, target, propertyKey);
    return descriptor;
  }
}