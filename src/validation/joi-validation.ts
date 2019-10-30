import { Request, Response } from 'express';
import { IRequestData } from '../interfaces';
import Joi from '@hapi/joi';
import { IValidationSchema } from './interfaces';

export function getValidationMiddleware(validationSchema: IValidationSchema, validationOptions?: Joi.ValidationOptions) {
  return function(req: Request, res: Response, next: any) {

    const dataToValidate: IRequestData = {};
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
