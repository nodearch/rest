import { Request, Response } from 'express';
import { METADATA_KEY } from '../constants';

type ClassMethodDecorator = (target: Function | Object, propertyKey?: string) => void;

export function Middleware(
  middleWares: Array<(req: Request, res: Response, next?: (error?: any) => void) => void>
): ClassMethodDecorator {
  return function (target: any, propertyKey?: string): void {
    if (typeof target === 'function') {
      // class decorator
      Reflect.defineMetadata(METADATA_KEY.ARCH_MIDDLEWARE, middleWares, target);
    }
    else {
      // method decorator
      if (target && propertyKey) {
        Reflect.defineMetadata(METADATA_KEY.ARCH_MIDDLEWARE, middleWares, target, propertyKey);
      }
    }
  }
}