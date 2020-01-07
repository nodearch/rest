import express from 'express';
import { HttpError } from './errors';


export type HttpErrorHandler = (error: HttpError, res: express.Response) => void;