import { Request, Response } from 'express';
import { METADATA_KEY } from '../constants';
import * as metadata from '../metadata';

type ClassMethodDecorator = (target: Function | Object, propertyKey?: string) => void;
type Middleware = (req: Request, res: Response, next?: (error?: any) => void) => void;

export function Middleware(middleWares: Middleware[] | Middleware): ClassMethodDecorator {
  return function (target: any, propertyKey?: string): void {

    middleWares = Array.isArray(middleWares)? middleWares : [middleWares];
    if (typeof target === 'function') {
      // class decorator
      metadata.common.setClassMetadata(METADATA_KEY.MIDDLEWARE, target, middleWares);
    }
    else {
      // method decorator
      if (target && propertyKey) {
        metadata.common.setMethodMetadata(METADATA_KEY.MIDDLEWARE, target, propertyKey, middleWares);

      }
    }
  }
}