import { SwaggerConfig } from '../swagger';
import Joi from '@hapi/joi';
import multer from 'multer';

export interface IConnection {
  port: number;
  hostname: string;
  joiValidationOptions?: Joi.ValidationOptions;
  swagger?: SwaggerConfig;
  fileUploadOptions?: multer.Options;
}
