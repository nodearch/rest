import { Request, Response } from 'express';
import { RequestData } from '../interfaces';
import Joi from '@hapi/joi';

export function getValidationMiddleware(validationSchema: any, validationOptions?: Joi.ValidationOptions) {
  return function(req: Request, res: Response, next: any) {

    const dataToValidate: RequestData = {};

    if (req.params) {
      Object.assign(dataToValidate, { params: req.params });
    }

    if (req.cookies) {
      Object.assign(dataToValidate, { cookies: req.cookies });
    }

    if (req.headers) {
      Object.assign(dataToValidate, { headers: req.headers });
    }

    if (req.query) {
      Object.assign(dataToValidate, { query: req.query });
    }

    if (req.body) {
      Object.assign(dataToValidate, { body: req.body });
    }

    const result = Joi.validate(dataToValidate, validationSchema, validationOptions);

    if (result.error) {
      res.status(400).json(result.error.details);
    }
    else {
      next();
    }
  };
}
