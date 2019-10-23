import * as metadata from '../../metadata';
import { HttpResponse } from '../interfaces/swagger';

export function ResponseSchemas(httpResponses: HttpResponse[]): MethodDecorator {
  return <MethodDecorator> function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    metadata.controller.setMethodHttpResponses(target, propertyKey, httpResponses);

    return descriptor;
  };
}
