import { RestServer } from './server';
export * from './decorators';
export * from './interfaces';
export * from './types';
import { HttpMethod } from './enums';
import express from 'express';

export {
  RestServer,
  HttpMethod,
  express
};