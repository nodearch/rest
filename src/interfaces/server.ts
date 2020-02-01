import Joi from '@hapi/joi';
import multer from 'multer';
import express from 'express';
import http from 'http';
import { IHttpErrorsOptions } from '../errors/interfaces';
import serveStatic from 'serve-static';
import bodyParser from 'body-parser';

export interface IJsonConfig {
  disable?: boolean;
  options?: bodyParser.OptionsJson;
}

export interface IUrlencodedConfig {
  disable?: boolean;
  options?: bodyParser.OptionsUrlencoded;
}

export interface IServeStaticConfig {
  path: string;
  options?: serveStatic.ServeStaticOptions;
}

export interface IServerConfig {
  port?: number;
  hostname?: string;
  urlencoded?: IUrlencodedConfig;
  json?: IJsonConfig;
  static?: IServeStaticConfig;
  httpErrorsOptions?: IHttpErrorsOptions;
  joiValidationOptions?: Joi.ValidationOptions;
  fileUploadOptions?: multer.Options;
}

export interface IServerOptions {
  config?: IServerConfig;
  middlewares?: express.RequestHandler[];
}
