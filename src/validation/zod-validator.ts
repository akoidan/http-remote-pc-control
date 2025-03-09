import {createParamDecorator, ExecutionContext,Injectable, PipeTransform, BadRequestException} from '@nestjs/common';
import {
  ZodError,
  ZodTypeAny,
} from 'zod';


@Injectable()
class ZodValidationPipe<T> implements PipeTransform {
  constructor(private readonly schema: ZodTypeAny) {}

  transform(value: unknown): T {
    try {
      return this.schema.parse(value) as T; // Zod validation
    } catch (error) {
      if (error instanceof ZodError) {
        throw new BadRequestException(error.errors);
      }
      throw error;
    }
  }
}

export function ZodBody(schema: ZodTypeAny): ParameterDecorator  {
  return createParamDecorator(
    (data: unknown, ctx: ExecutionContext) => {
      const request = ctx.switchToHttp().getRequest();
      // Apply Zod validation pipe
      return new ZodValidationPipe(schema).transform(request.body);
    },
  )();
}
