import Joi from '@hapi/joi';
import multer from 'multer';

export interface IRouteHandlerOptions {
  joiValidationOptions?: Joi.ValidationOptions;
  fileUploadOptions?: multer.Options;
}
