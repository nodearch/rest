import { ILogger } from '@nodearch/core';

export class Logger implements ILogger {
  error(...args: any[]) {
    console.log(...args);
  }

  warn(...args: any[]) {
    console.log(...args);
  }

  info(...args: any[]) {
    console.log(...args);
  }

  debug(...args: any[]) {
    console.log(...args);
  }
} 