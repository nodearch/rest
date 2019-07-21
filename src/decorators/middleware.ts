import 'reflect-metadata';
import { Request, Response } from 'express';
import { METADATA_KEY } from '../constants';
import { proto } from '@nodearch/core';

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


// export function Middleware(
//   middleWares: Array<(req: Request, res: Response, next?: (error?: any) => void) => void>
// ): MethodDecorator {
//   return <MethodDecorator>function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
//     Reflect.defineMetadata(METADATA_KEY.ARCH_MIDDLEWARE, middleWares, target, propertyKey);
//     return descriptor;
//   }
// }

// export function GroupMiddleware(
//   middleWares: Array<(req: Request, res: Response, next?: (error?: any) => void) => void>
// ): ClassDecorator {
//   return function (target: object) {

//   }
// }
