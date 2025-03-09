import {
  createParamDecorator,
  ExecutionContext,
  Injectable,
  PipeTransform,
  BadRequestException,
} from '@nestjs/common';
import { ApiBody } from '@nestjs/swagger';
import { ZodError, ZodTypeAny } from 'zod';
import { createZodDto } from 'nestjs-zod/dto';

@Injectable()
class ZodValidationPipe<T> implements PipeTransform {
  constructor(private readonly schema: ZodTypeAny) {}

  transform(value: unknown): T {
    try {
      return this.schema.parse(value) as T;
    } catch (error) {
      if (error instanceof ZodError) {
        throw new BadRequestException(error.errors);
      }
      throw error;
    }
  }
}

export function ZodBody<T extends ZodTypeAny>(schema: T) {
  const dtoClass = createZodDto(schema);

  return (target: any, propertyKey: string, parameterIndex: number) => {
    // Apply validation pipe
    const validationDecorator = createParamDecorator(
      (data: unknown, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        return new ZodValidationPipe(schema).transform(request.body);
      }
    )();

    // Apply Swagger documentation
    ApiBody({ type: dtoClass })(target, propertyKey, {});

    // Apply validation
    validationDecorator(target, propertyKey, parameterIndex);
  };
}
