import  {type Logger, BadRequestException} from '@nestjs/common';


interface HasLogger {
  logger: Logger;
  os : NodeJS.Platform;
}

export function Safe400(supported?: NodeJS.Platform[]) {
  // eslint-disable-next-line
  return function(
      target: HasLogger,
      propertyKey: string | symbol,
      descriptor: TypedPropertyDescriptor<(...args: unknown[]) => unknown>
  ) {
    const originalMethod = descriptor.value!;
    if (originalMethod.constructor.name === 'Function') {
      // eslint-disable-next-line func-names
      descriptor.value = function(...args: unknown[]): unknown {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        if (typeof supported !== 'undefined' && !supported.includes(this.os)) {
          throw new BadRequestException(`Unsupported method ${String(propertyKey)} on platform ${this.os}`);
        }
        this.logger.debug(`Calling ${String(propertyKey)}(${JSON.stringify(args)})`);
        try {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return
          const res =  originalMethod.apply(this, args);
          this.logger.log(`${String(propertyKey)}(${JSON.stringify(args)})=${JSON.stringify(res)}`);
          return res;
        } catch (e: unknown) {
          this.logger.error(`${String(propertyKey)}(${JSON.stringify(args)}) throws ${(e as Error)?.message ?? e}`, (e as Error).stack);
          throw new BadRequestException(
              `Unable to execute ${String(propertyKey)} because ${(e as Error)?.message ?? e}`
          );
        }
      };
    } else if (originalMethod.constructor.name === 'AsyncFunction') {
      // eslint-disable-next-line func-names
      descriptor.value = async function(...args: unknown[]): Promise<unknown> {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        if (typeof supported !== 'undefined' && !supported.includes(this.os)) {
          throw new BadRequestException(`Unsupported method ${String(propertyKey)} on platform ${this.os}`);
        }
        this.logger.debug(`Calling ${String(propertyKey)}(${JSON.stringify(args)})`);
        try {
          // eslint-disable-next-line
          const res =  await originalMethod.apply(this, args);
          this.logger.log(`await ${String(propertyKey)}(${JSON.stringify(args)})=${JSON.stringify(res)}`);
          return res;
        } catch (e: unknown) {
          this.logger.error(`await ${String(propertyKey)}(${JSON.stringify(args)}) throws ${(e as Error)?.message ?? e}`, (e as Error).stack);
          throw new BadRequestException(
              `Unable to execute ${String(propertyKey)} because ${(e as Error)?.message ?? e}`
          );
        }
      };
    }
  };
}