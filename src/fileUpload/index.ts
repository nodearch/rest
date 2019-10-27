import multer from 'multer';
import { IFileUpload } from '../interfaces';
import { Request, Response } from 'express';
import path from 'path';
import os from 'os';

export function getFileUploadMiddleware(filesUpload: IFileUpload[], options?: multer.Options) {
  return function(req: Request, res: Response, next: any) {

    const multerOptions = options || { dest: path.join(os.tmpdir(), 'nodearch-file-uploads') };
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

    return upload(req, res, (err?: any) => {

      if (err) {
        res.status(400).json(err);
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

  if (req.files) {
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
