import multer from 'multer';
import { IFileUpload } from './file-upload.interface';
import { Request, Response } from 'express';
import path from 'path';
import os from 'os';
import { IControllerMethod, ControllerInfo } from '@nodearch/core';
import * as metadata from '../metadata';

const tmpdir = path.join(os.tmpdir(), 'nodearch-file-uploads');

export function getFileUploadMiddleware(
  controllerInfo: ControllerInfo,
  methodInfo: IControllerMethod,
  fileUploadOptions?: multer.Options
) {
  const fileUpload = metadata.controller.getMethodFileUpload(controllerInfo.classInstance, methodInfo.name);

  if (fileUpload && fileUpload.length) {
    return middlewareFactory(fileUpload, fileUploadOptions);
  }
}

function middlewareFactory(filesUpload: IFileUpload[], options?: multer.Options) {

  return function (req: Request, res: Response, next: any) {

    const multerOptions = options || { dest: tmpdir };
    let upload;

    if (filesUpload.length === 1) {
      if (filesUpload[0].maxCount && filesUpload[0].maxCount > 1) {
        upload = multer(multerOptions).array(filesUpload[0].name, filesUpload[0].maxCount);
      }
      else {
        upload = multer(multerOptions).single(filesUpload[0].name);
      }
    }
    else {
      upload = multer(multerOptions).fields(filesUpload);
    }

    return upload(req, res, (err?: Error) => {

      if (err) {
        res.status(400).json(errorMassage(err));
      }
      else {
        moveFilesToBody(req);
        next();
      }
    });
  };

}

function moveFilesToBody(req: Request) {

  if (req.file && req.file.fieldname) {

    req.body[req.file.fieldname] = req.file;
    delete req.file;
  }
  else if (req.files) {

    if (Array.isArray(req.files)) {

      for (const file of req.files) {
        req.body[file.fieldname] = file;
      }
      delete req.files;
    }
    else {
      for (const fileName in req.files) {
        req.body[fileName] = req.files[fileName];
      }
      delete req.files;
    }
  }
}

function errorMassage(err: Error) {

  const mul: any = multer;

  if (err instanceof mul.MulterError) {
    return { message: `FileUpload: ${err.message}` };
  }
  else {
    return { message: 'FileUpload: Something went wrong while uploading file' };
  }
}
