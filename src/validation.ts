import { Request, Response } from 'express';
import { RequestData } from './interfaces';
import { ValidationStrategy } from './types/validation-strategy';

export function validate (validationStrategy: ValidationStrategy, validationSchema: any) {
  return function (req: Request, res: Response, next: any) {

    const dataToValidate: RequestData = {};

    if (req.headers) {
      Object.assign(dataToValidate, { headers: req.headers });
    }

    if (req.query) {
      Object.assign(dataToValidate, { query: req.query });
    }

    if (req.body) {
      Object.assign(dataToValidate, { body: req.body });
    }

    validationStrategy(dataToValidate, validationSchema, function (errors?: any) {
      if (!errors) {
        next();
      }
      else {
        res.status(400).json(errors);
      }
    });
  }
}
