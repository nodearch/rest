import { HttpMethod } from "./enums";

export interface RouteInfo {
  method: HttpMethod;
  path: string;
}