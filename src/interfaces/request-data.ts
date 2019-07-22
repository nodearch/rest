export interface RequestData {
  headers?: { [key: string]: string };
  query?: { [key: string]: string };
  body?: any;
}