
import Joi from '@hapi/joi';

export interface ValidationSchema {

  headers?: Joi.ObjectSchema;
  query?: Joi.ObjectSchema;
  params?: Joi.ObjectSchema;
  body?: Joi.Schema;

}
