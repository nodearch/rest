import { Request, Response } from 'express';
import { IRequestData } from '../interfaces';
import Joi from '@hapi/joi';
import { IValidationSchema } from './validation-schema.interface';
import * as metadata from '../metadata';
import { ControllerInfo, IControllerMethod } from '@nodearch/core';

export function getValidationMiddleware(
  controllerInfo: ControllerInfo,
  methodInfo: IControllerMethod,
  validationOptions?: Joi.ValidationOptions
) {
  const validationSchema: IValidationSchema = metadata.controller.getMethodValidationSchema(controllerInfo.classInstance, methodInfo.name);

  if (!validationSchema) return;

  return function (req: Request, res: Response, next: any) {

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
