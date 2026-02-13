/* eslint-disable no-console */
import {Injectable, LogLevel} from '@nestjs/common';
import clc from 'cli-color';
import {AsyncLocalStorage} from 'async_hooks';
import {LoggerService} from '@nestjs/common/services/logger.service';


@Injectable()
class ConsoleLogger implements LoggerService {
  constructor(
      private readonly asyncStorage: AsyncLocalStorage<Map<string, any>>,
      private logLevels: LogLevel[] = ['error', 'warn', 'log', 'debug', 'verbose', 'fatal']
  ) {
  }

  setLogLevels(levels: LogLevel[]): void {
    this.logLevels = levels;
  }

  setLogLevel(level: LogLevel): void {
    const levelMap: Record<LogLevel, LogLevel[]> = {
      fatal: ['fatal'],
      error: ['error', 'fatal'],
      warn: ['error', 'warn', 'fatal'],
      log: ['error', 'warn', 'log', 'fatal'],
      debug: ['error', 'warn', 'log', 'debug', 'fatal'],
      verbose: ['error', 'warn', 'log', 'debug', 'verbose', 'fatal'],
    };
    this.logLevels = levelMap[level];
  }

  private logFormat(
      level: string,
      message: string,
      levelColor: (text: string) => string,
      messageStyle?: (text: string) => string
  ): string {
    const timestamp = clc.xterm(100)(`[${this.getCurrentTime()}]`);

    const store = this.asyncStorage.getStore();
    const id =  store ?  levelColor(store.get('comb') as string):  levelColor(level);
    return `${timestamp} ${id}: ${messageStyle ? messageStyle(message) : message}`;
  }

  private getCurrentTime(): string {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    const millis = now.getMilliseconds().toString().padStart(3, '0');
    return `${hours}:${minutes}:${seconds}.${millis}`;
  }

  error(message: string|Error, trace?: string): void {
    if (this.logLevels.includes('error')) {
      console.error(this.logFormat('ERROR', (message as Error)?.message ?? message, clc.bold.redBright, clc.red));
      if (trace ?? (message as Error)?.stack) {
        console.error(clc.red(trace ?? (message as Error)?.stack));
      }
    }
  }

  warn(message: string): void {
    if (this.logLevels.includes('warn')) {
      console.warn(this.logFormat('WARN', message, clc.bold.yellow, clc.yellow));
    }
  }

  log(message: string): void {
    if (this.logLevels.includes('log')) {
      console.info(this.logFormat('INFO', message, clc.bold.blue, clc.cyan));
    }
  }

  debug(message: string): void {
    if (this.logLevels.includes('debug')) {
      console.debug(this.logFormat('DEBUG', message, clc.xterm(2), clc.xterm(7)));
    }
  }


  verbose(message: string): void {
    if (this.logLevels.includes('verbose')) {
      console.log(this.logFormat('VERBOSE', message, clc.bold.magenta, clc.xterm(7)));
    }
  }

  fatal(message: string|Error, trace?: string): void {
    console.error(this.logFormat('FATAL', (message as Error)?.message ?? message, clc.bold.redBright, clc.red));
    if (trace ?? (message as Error)?.stack) {
      console.error(clc.red(trace ?? (message as Error)?.stack));
    }
  }
}

export {ConsoleLogger};
