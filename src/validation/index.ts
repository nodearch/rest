import { Request, Response } from 'express';
import { RequestData } from '../interfaces';
import Joi from '@hapi/joi';

export function getValidationMiddleware(validationSchema: any, validationOptions?: Joi.ValidationOptions) {
  return function(req: Request, res: Response, next: any) {

    const dataToValidate: RequestData = {};

    Object.assign(dataToValidate, {
      params: req.params,
      headers: req.headers,
      query: req.query,
      body: req.body
    });

    const result = Joi.validate(dataToValidate, validationSchema, validationOptions);
    
    if (result.error) {
      res.status(400).json(result.error.details);
    }
    else {
      Object.assign(req, result.value);
      next();
    }
  };
}
