import { ILogger } from "@nodearch/core";

export class Logger implements ILogger {
  error(...args: any[]): void {
    throw new Error("Method not implemented.");
  }
  
  warn(...args: any[]): void {
    throw new Error("Method not implemented.");
  }
  
  info(...args: any[]): void {
    throw new Error("Method not implemented.");
  }
  
  debug(...args: any[]): void {
    throw new Error("Method not implemented.");
  }
}