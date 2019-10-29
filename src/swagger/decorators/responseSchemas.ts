import * as metadata from '../../metadata';
import { IHttpResponseSchema } from '../interfaces';

export function ResponseSchemas(httpResponses: IHttpResponseSchema[]): MethodDecorator {
  return <MethodDecorator> function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    metadata.controller.setMethodHttpResponses(target, propertyKey, httpResponses);

    return descriptor;
  };
}
