import 'reflect-metadata';
import { METADATA_KEY } from './constants';
import { HttpMethod } from './enums';
import { RouteInfo } from './interfaces';


function addRouteInfo (target: any, propertyKey: string, method: HttpMethod, path?: string) {
  const routeInfo: RouteInfo = {
    method: method,
    path: path || '/' // default to root
  };

  Reflect.defineMetadata(METADATA_KEY.ARCH_ROUTE_INFO, routeInfo, target, propertyKey);
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

export function Head (path?: string) {
  return function (target: any, propertyKey: string) {
    addRouteInfo(target, propertyKey, HttpMethod.HEAD, path);
  }
}

export function Patch (path?: string) {
  return function (target: any, propertyKey: string) {
    addRouteInfo(target, propertyKey, HttpMethod.PATCH, path);
  }
}

export function Options (path?: string) {
  return function (target: any, propertyKey: string) {
    addRouteInfo(target, propertyKey, HttpMethod.OPTIONS, path);
  }
}