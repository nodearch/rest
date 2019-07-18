import { METADATA_KEY } from './constants';
import { HttpMethod } from './enums';


function addRouteInfo (target: any, propertyKey: string, method: HttpMethod, path?: string) {
  const route = `${method} ${path || '/'}`;
  Reflect.defineMetadata(METADATA_KEY.ARCH_ROUTE_INFO, route, target, propertyKey);
}

export function Get (path?: string) {
  return function (target: any, propertyKey: string) {
    addRouteInfo(target, propertyKey, HttpMethod.GET, path);
  }
}

export function Post (path?: string) {
  return function (target: any, propertyKey: string) {
    addRouteInfo(target, propertyKey, HttpMethod.POST, path);
  }
}

export function Put (path?: string) {
  return function (target: any, propertyKey: string) {
    addRouteInfo(target, propertyKey, HttpMethod.PUT, path);
  }
}

export function Delete (path?: string) {
  return function (target: any, propertyKey: string) {
    addRouteInfo(target, propertyKey, HttpMethod.DELETE, path);
  }
}