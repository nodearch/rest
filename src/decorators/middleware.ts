import { Request, Response } from 'express';
import * as metadata from '../metadata';

type ClassMethodDecorator = (target: Function | Object, propertyKey?: string) => void;
type Middleware = (req: Request, res: Response, next?: (error?: any) => void) => void;

export function Middleware(middleWares: Middleware[] | Middleware): ClassMethodDecorator {
  return function(target: any, propertyKey?: string): void {

    middleWares = Array.isArray(middleWares) ? middleWares : [middleWares];
    if (typeof target === 'function') {
      // class decorator
      metadata.controller.setControllerMiddlewares(target, middleWares);
    }
    else {
      // method decorator
      if (target && propertyKey) {
        metadata.controller.setControllerMethodMiddlewares(target, propertyKey, middleWares);
      }
    }
  };
}
