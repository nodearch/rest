import * as metadata from '../metadata';
import { FileUpload } from '../interfaces';

export function Upload(files: string | string[] | FileUpload | FileUpload[]): MethodDecorator {
  return <MethodDecorator> function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {

    const filesUpload: FileUpload[] = structureFileUpload(files);
    metadata.controller.setMethodFileUpload(target, propertyKey, filesUpload);

    return descriptor;
  };
}

function structureFileUpload(files: any): FileUpload[] {

  let filesUpload: FileUpload[] = [];

  if (Array.isArray(files)) {
    filesUpload = typeof files[0] === 'string' ? files.map(fileName => ({ name: fileName })) : files;
  }
  else {
    filesUpload = typeof files === 'string' ? [{ name: files }] : [files];
  }

  return filesUpload;
}
