import { METADATA_PREFIX } from '../constants';


export function getClassMetadata<T = any>(key: string, target: any): T {
  return Reflect.getMetadata(METADATA_PREFIX + key, target);
}

export function getMethodMetadata<T = any>(key: string, target: any, propertyKey: string): T {
  return Reflect.getMetadata(METADATA_PREFIX + key, target, propertyKey);
}

export function setClassMetadata(key: string, target: any, value: any) {
  Reflect.defineMetadata(METADATA_PREFIX + key, value, target);
}

export function setMethodMetadata(key: string, target: any, propertyKey: string, value: any) {
  Reflect.defineMetadata(METADATA_PREFIX + key, value, target, propertyKey);
}

export function getClassParams(target: any): any[] {
  return Reflect.getMetadata('design:paramtypes', target) || [];
}

export function getMethodParams(target: any, propertyKey: string): any[] {
  return Reflect.getMetadata('design:paramtypes', target, propertyKey) || [];
}