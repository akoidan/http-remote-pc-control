import  {type Logger, BadRequestException} from '@nestjs/common';


interface HasLogger {
  logger: Logger;
  os : NodeJS.Platform;
}

export function Safe400(unsupported: NodeJS.Platform[] = []) {
  // eslint-disable-next-line
  return function(
      target: HasLogger,
      propertyKey: string | symbol,
      descriptor: TypedPropertyDescriptor<(...args: unknown[]) => unknown>
  ) {

    TODO FIX< this method will not work unless we make it synchronous and asynchornous at the same type
    if its synchronous then calliny async w/o await would not trigger catch block
    if its async, then outside method wouldnt works

    const originalMethod = descriptor.value!;
    // TODO im not sure if it works with async
    // eslint-disable-next-line func-names
    descriptor.value = function(...args: unknown[]): unknown {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      if (unsupported.includes(this.os)) {
        throw new BadRequestException(`Unsupported method ${String(propertyKey)} on platform ${this.os}`);
      }
      this.logger.log(`Calling getMonitors ${String(propertyKey)} with arguments ${JSON.stringify(args)}`);
      try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return originalMethod.apply(this, args);
      } catch (e: unknown) {
        throw new BadRequestException(
            `Unable to execute ${String(propertyKey)} because ${(e as Error)?.message ?? e}`
        );
      }
    };
  };
}