import { METADATA_KEY } from '../constants';
import { getClassMetadata, setClassMetadata, getMethodMetadata, setMethodMetadata } from './common.metadata';
import { HttpMethod } from '../enums';
import { IFileUpload } from '../interfaces';
import { IValidationSchema } from '../validation';
import { IHttpResponseSchema } from '../swagger';

// ====> Controller Middlewares

export function getControllerMiddlewares(controllerDef: any): any[] {
  return getClassMetadata(METADATA_KEY.MIDDLEWARE, controllerDef) || [];
}

export function setControllerMiddlewares(controllerDef: any, middlewares: any[]): void {
  setClassMetadata(METADATA_KEY.MIDDLEWARE, controllerDef, middlewares);
}

// ====> Controller Method Middlewares

export function getControllerMethodMiddlewares(controllerInstance: any, methodName: string): any[] {
  return getMethodMetadata(METADATA_KEY.MIDDLEWARE, controllerInstance, methodName) || [];
}

export function setControllerMethodMiddlewares(controllerDef: any, methodName: string, middlewares: any[]): void {
  setMethodMetadata(METADATA_KEY.MIDDLEWARE, controllerDef, methodName, middlewares);
}

// ====> HTTP METHOD

export function getMethodHTTPMethod(controllerInstance: any, methodName: string): HttpMethod {
  return <HttpMethod> getMethodMetadata(METADATA_KEY.HTTP_METHOD, controllerInstance, methodName);
}

export function setMethodHTTPMethod(controllerDef: any, methodName: string, httpMethod: HttpMethod) {
  return setMethodMetadata(METADATA_KEY.HTTP_METHOD, controllerDef, methodName, httpMethod);
}

// ====> HTTP PATH

export function getMethodHTTPPath(controllerInstance: any, methodName: string): string {
  return getMethodMetadata(METADATA_KEY.ROUTE_INFO, controllerInstance, methodName);
}

export function setMethodHTTPPath(controllerDef: any, methodName: string, httpPath: string) {
  return setMethodMetadata(METADATA_KEY.ROUTE_INFO, controllerDef, methodName, httpPath);
}

// ====> Validation Schema

export function getMethodValidationSchema(controllerInstance: any, methodName: string): IValidationSchema {
  return getMethodMetadata(METADATA_KEY.VALIDATION_SCHEMA, controllerInstance, methodName);
}

export function setMethodValidationSchema(controllerDef: any, methodName: string, schema: IValidationSchema) {
  setMethodMetadata(METADATA_KEY.VALIDATION_SCHEMA, controllerDef, methodName, schema);
}

// ====> API Responses Schema

export function getMethodHttpResponses(controllerInstance: any, methodName: string): IHttpResponseSchema[] {
  return getMethodMetadata(METADATA_KEY.SWAGGER_HTTP_RESPONSES, controllerInstance, methodName);
}

export function setMethodHttpResponses(controllerDef: any, methodName: string, responsesSchema: IHttpResponseSchema[]) {
  setMethodMetadata(METADATA_KEY.SWAGGER_HTTP_RESPONSES, controllerDef, methodName, responsesSchema);
}

// ====> File Upload

export function getMethodFileUpload(controllerInstance: any, methodName: string): IFileUpload[] {
  return getMethodMetadata(METADATA_KEY.FILE_UPLOAD, controllerInstance, methodName);
}

export function setMethodFileUpload(controllerDef: any, methodName: string, files: IFileUpload[]) {
  setMethodMetadata(METADATA_KEY.FILE_UPLOAD, controllerDef, methodName, files);
}
