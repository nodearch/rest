import { HttpErrorHandler } from './types';
import { HttpError } from './errors';
import express from 'express';

export interface IHttpErrorHandlerInfo {
  error: any;
  handler: HttpErrorHandler;
}

export interface IHttpErrorsOptions {
  default?(error: HttpError | Error, res: express.Response): void;
  custom?: IHttpErrorHandlerInfo[];
}
