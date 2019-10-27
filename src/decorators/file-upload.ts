import * as metadata from '../metadata';
import { IFileUpload } from '../interfaces';

export function Upload(files: string | string[] | IFileUpload | IFileUpload[]): MethodDecorator {
  return <MethodDecorator> function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {

    const filesUpload: IFileUpload[] = structureIFileUpload(files);
    metadata.controller.setMethodFileUpload(target, propertyKey, filesUpload);

    return descriptor;
  };
}

function structureIFileUpload(files: any): IFileUpload[] {

  let filesUpload: IFileUpload[] = [];

  if (Array.isArray(files)) {
    filesUpload = typeof files[0] === 'string' ? files.map(fileName => ({ name: fileName })) : files;
  }
  else {
    filesUpload = typeof files === 'string' ? [{ name: files }] : [files];
  }

  return filesUpload;
}
