import { HttpMethod } from './enums';
import { RouteInfo } from './interfaces';

export function getRouteInfo (method: HttpMethod, path?: string): RouteInfo {

  let routePath = '/';

  if (path) {
    routePath = path.charAt(0) === '/' ? path : '/' + path;
  }

  return {
    method: method,
    path: routePath
  };
}