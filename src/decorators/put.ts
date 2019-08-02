import { METADATA_KEY } from '../constants';
import { HttpMethod } from '../enums';
import { RouteInfo } from '../interfaces';
import { getRouteInfo } from '../routing';


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

    const routeInfo: RouteInfo = getRouteInfo(HttpMethod.PUT, path);
    Reflect.defineMetadata(METADATA_KEY.ARCH_ROUTE_INFO, routeInfo, target, propertyKey);

    return descriptor;
  }
}