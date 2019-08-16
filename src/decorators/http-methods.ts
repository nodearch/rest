import { HttpMethod } from '../enums';
import * as metadata from '../metadata';


/**
 * Method Decorator to route HTTP GET requests to the specified path.
 * @param path
 *  The path for which the controller method is invoked. can be any of:
 *    - A string representing a path.
 *    - A path pattern.
 *    - A regular expression pattern to match paths.
 *    - An array of combinations of any of the above.
 *    - examples: https://expressjs.com/en/4x/api.html#path-examples.
 */
export function Get (path?: string): MethodDecorator {
  return <MethodDecorator>function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {

    metadata.controller.setMethodHTTPMethod(target, propertyKey, HttpMethod.GET);
    metadata.controller.setMethodHTTPPath(target, propertyKey, getPath(path));

    return descriptor;
  }
}

/**
 * Method Decorator to route HTTP HEAD requests to the specified path.
 * @param path
 *  The path for which the mcontroller method is invoked. can be any of:
 *    - A string representing a path.
 *    - A path pattern.
 *    - A regular expression pattern to match paths.
 *    - An array of combinations of any of the above.
 *    - examples: https://expressjs.com/en/4x/api.html#path-examples.
 */
export function Head (path?: string): MethodDecorator {
  return <MethodDecorator>function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {

    metadata.controller.setMethodHTTPMethod(target, propertyKey, HttpMethod.HEAD);
    metadata.controller.setMethodHTTPPath(target, propertyKey, getPath(path));

    return descriptor;
  }
}

/**
 * Method Decorator to route HTTP POST requests to the specified path.
 * @param path
 *  The path for which the controller method is invoked. can be any of:
 *    - A string representing a path.
 *    - A path pattern.
 *    - A regular expression pattern to match paths.
 *    - An array of combinations of any of the above.
 *    - examples: https://expressjs.com/en/4x/api.html#path-examples.
 */
export function Post (path?: string): MethodDecorator {
  return <MethodDecorator>function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {

    metadata.controller.setMethodHTTPMethod(target, propertyKey, HttpMethod.POST);
    metadata.controller.setMethodHTTPPath(target, propertyKey, getPath(path));
    
    return descriptor;
  }
}

/**
 * Method Decorator to route HTTP PUT requests to the specified path.
 * @param path
 *  The path for which the controller method is invoked. can be any of:
 *    - A string representing a path.
 *    - A path pattern.
 *    - A regular expression pattern to match paths.
 *    - An array of combinations of any of the above.
 *    - examples: https://expressjs.com/en/4x/api.html#path-examples.
 */
export function Put (path?: string): MethodDecorator {
  return <MethodDecorator>function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {

    metadata.controller.setMethodHTTPMethod(target, propertyKey, HttpMethod.PUT);
    metadata.controller.setMethodHTTPPath(target, propertyKey, getPath(path));
    
    return descriptor;
  }
}

/**
 * Method Decorator to route HTTP PATCH requests to the specified path.
 * @param path
 *  The path for which the controller method is invoked. can be any of:
 *    - A string representing a path.
 *    - A path pattern.
 *    - A regular expression pattern to match paths.
 *    - An array of combinations of any of the above.
 *    - examples: https://expressjs.com/en/4x/api.html#path-examples.
 */
export function Patch (path?: string): MethodDecorator {
  return <MethodDecorator>function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {

    metadata.controller.setMethodHTTPMethod(target, propertyKey, HttpMethod.PATCH);
    metadata.controller.setMethodHTTPPath(target, propertyKey, getPath(path));

    return descriptor;
  }
}

/**
 * Method Decorator to route HTTP DELETE requests to the specified path.
 * @param path
 *  The path for which the controller method is invoked. can be any of:
 *    - A string representing a path.
 *    - A path pattern.
 *    - A regular expression pattern to match paths.
 *    - An array of combinations of any of the above.
 *    - examples: https://expressjs.com/en/4x/api.html#path-examples.
 */
export function Delete (path?: string): MethodDecorator {
  return <MethodDecorator>function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {

    metadata.controller.setMethodHTTPMethod(target, propertyKey, HttpMethod.DELETE);
    metadata.controller.setMethodHTTPPath(target, propertyKey, getPath(path));

    return descriptor;
  }
}

/**
 * Method Decorator to route HTTP OPTIONS requests to the specified path.
 * @param path
 *  The path for which the controller method is invoked. can be any of:
 *    - A string representing a path.
 *    - A path pattern.
 *    - A regular expression pattern to match paths.
 *    - An array of combinations of any of the above.
 *    - examples: https://expressjs.com/en/4x/api.html#path-examples.
 */
export function Options (path?: string): MethodDecorator {
  return <MethodDecorator>function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {

    metadata.controller.setMethodHTTPMethod(target, propertyKey, HttpMethod.OPTIONS);
    metadata.controller.setMethodHTTPPath(target, propertyKey, getPath(path));
    
    return descriptor;
  }
}


function getPath(path?: string) {
  let routePath = '/';

  if (path) {
    routePath = path.charAt(0) === '/' ? path : '/' + path;
  }

  return routePath;
}