import { IHttpErrorsOptions } from './interfaces';
import { HttpError, InternalServerError } from './errors';
import express from 'express';


export class HttpErrorsRegistry {
  private options?: IHttpErrorsOptions;

  constructor(options?: IHttpErrorsOptions) {
    this.options = options;
  }

  private defaultHandler(error: HttpError | Error, res: express.Response) {
    const httpError: HttpError = error instanceof HttpError? error : new InternalServerError(error.message);

    res.status(httpError.code).json({
      error: httpError.message,
      data: httpError.data || undefined
    });
  }

  handleError(error: any, res: express.Response) {
    const handler = this.options?.custom?.find(x => error instanceof x.error)?.handler || this.options?.default || this.defaultHandler;
    handler(error, res);
  }
}