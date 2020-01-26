import Joi from '@hapi/joi';
import multer from 'multer';
import { IHttpErrorsOptions } from '../errors/interfaces';
import { Sequence } from '../sequence';

export interface IServerConfig {
  port: number;
  hostname: string;
  httpErrorsOptions?: IHttpErrorsOptions;
  joiValidationOptions?: Joi.ValidationOptions;
  fileUploadOptions?: multer.Options;
}

export interface IServerOptions {
  config: IServerConfig;
  sequence: Sequence;
}