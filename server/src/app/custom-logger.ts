/* eslint-disable no-console */
import {
  ConsoleLogger,
  Injectable,
} from '@nestjs/common';
import clc from 'cli-color';

@Injectable()
export class CustomLogger extends ConsoleLogger {
  private static logFormat(
    level: string,
    message: string,
    levelColor: (text: string) => string,
    messageStyle?: (text: string) => string
  ): string {
    const timestamp = clc.xterm(100)(`[${CustomLogger.getCurrentTime()}]`);
    return `${timestamp} ${levelColor(level)}: ${messageStyle ? messageStyle(message) : message}`;
  }

  private static getCurrentTime(): string {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    const millis = now.getMilliseconds().toString().padStart(3, '0');
    return `${hours}:${minutes}:${seconds}.${millis}`;
  }

  log(message: string): void {
    // Make message more prominent with bright text and underline
    console.info(CustomLogger.logFormat('INFO', message, clc.bold.blue, clc.xterm(90)));
  }

  error(message: string, trace?: string): void {
    console.error(CustomLogger.logFormat('ERROR', message, clc.bold.redBright, clc.red));
    if (trace) {
      console.error(clc.red(trace));
    }
  }

  warn(message: string): void {
    console.warn(CustomLogger.logFormat('WARN', message, clc.bold.yellow, clc.yellow));
  }

  debug(message: string): void {
    console.debug(CustomLogger.logFormat('DEBUG', message, clc.bold.green, clc.xterm(7)));
  }

  verbose(message: string): void {
    console.log(CustomLogger.logFormat('VERBOSE', message, clc.bold.magenta, clc.xterm(7)));
  }
}
