import Joi from '@hapi/joi';
import multer from 'multer';

export interface IServerConfig {
  port: number;
  hostname: string;
  joiValidationOptions?: Joi.ValidationOptions;
  fileUploadOptions?: multer.Options;
}
