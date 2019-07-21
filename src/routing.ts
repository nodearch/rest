import 'reflect-metadata';
import { HttpMethod } from './enums';
import { RouteInfo } from './interfaces';

export function getRouteInfo (method: HttpMethod, path?: string): RouteInfo {
  return {
    method: method,
    path: path || '/' // default to root
  };
}