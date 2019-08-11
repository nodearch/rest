import { Request, Response } from 'express';
import { METADATA_KEY } from '../constants';
import { common } from '../metadata';

type ClassMethodDecorator = (target: Function | Object, propertyKey?: string) => void;
type Middleware = (req: Request, res: Response, next?: (error?: any) => void) => void;

export function Middleware(middleWares: Middleware[] | Middleware): ClassMethodDecorator {
  return function (target: any, propertyKey?: string): void {

    middleWares = Array.isArray(middleWares)? middleWares : [middleWares];
    if (typeof target === 'function') {
      // class decorator
      common.setClassMetadata(METADATA_KEY.ARCH_MIDDLEWARE, target, middleWares);
    }
    else {
      // method decorator
      if (target && propertyKey) {
        common.setMethodMetadata(METADATA_KEY.ARCH_MIDDLEWARE, target, propertyKey, middleWares);

      }
    }
  }
}