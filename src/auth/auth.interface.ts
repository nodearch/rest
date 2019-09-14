import express from 'express';
import { IGuard } from '@nodearch/core';

export interface IAuthGuard extends IGuard {
  guard(req: express.Request, res: express.Response, next: express.NextFunction): void;
}
