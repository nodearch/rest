import * as metadata from '../../metadata';
import { ISwagger } from '../interfaces';

export function Swagger(swaggerConfig: ISwagger) {

  return function(target: any, propertyKey?: string): void {

    if (typeof target === 'function') {
      metadata.controller.setControllerSwagger(target, swaggerConfig);
    }
    else if (target && propertyKey) {
      metadata.controller.setControllerMethodSwagger(target, propertyKey, swaggerConfig);
    }
  };
}
