import { Request, Response } from 'express';

export function validate (validationSchema: any) {
  return function (req: Request, res: Response, next: any) {
    console.log('in validation middleware');
    next();
  }
}

