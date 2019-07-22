import { RequestData } from '../interfaces';

export type ValidationStrategy = (requestData: RequestData, validationSchema: any, cb: (errors?: any) => void) => void;