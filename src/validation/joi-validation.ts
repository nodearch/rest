import { Request, Response } from 'express';
import { RequestData } from '../interfaces';
import Joi from '@hapi/joi';
import { ValidationSchema } from './index';

export function getValidationMiddleware(validationSchema: ValidationSchema, validationOptions?: Joi.ValidationOptions) {
  return function(req: Request, res: Response, next: any) {

    const dataToValidate: RequestData = {};
    const objectProperties: any = validationSchema;

    Object.assign(dataToValidate, {
      params: req.params,
      headers: req.headers,
      query: req.query,
      body: req.body
    });

    const result = Joi.object().keys(objectProperties).validate(dataToValidate, validationOptions);

    if (result.error) {
      res.status(400).json(result.error.details);
    }
    else {
      Object.assign(req, result.value);
      next();
    }
  };
}
