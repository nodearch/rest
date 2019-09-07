import Joi from '@hapi/joi';

export interface IRouteHandlerOptions {
  joiValidationOptions?: Joi.ValidationOptions;
}
