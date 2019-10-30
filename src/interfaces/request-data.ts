export interface IRequestData {
  headers?: { [key: string]: string };
  query?: { [key: string]: string };
  body?: any;
}
