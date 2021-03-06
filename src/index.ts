import 'reflect-metadata';

import { RestServer } from './server';
export * from './decorators';
export * from './interfaces';
export * from './types';
export * from './sequence';
import { HttpMethod } from './enums';
import express from 'express';
import Joi from '@hapi/joi';

export {
  RestServer,
  HttpMethod,
  express,
  Joi
};