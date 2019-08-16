import express from "express";

export interface IAuthGuard {
  guard(req: express.Request, res: express.Response, next: express.NextFunction): void;
}
