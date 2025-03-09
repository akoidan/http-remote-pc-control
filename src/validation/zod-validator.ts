import {createParamDecorator, ExecutionContext, Injectable, PipeTransform, BadRequestException} from '@nestjs/common';
import {
  ZodError,
  ZodTypeAny,
} from 'zod';
import {createZodDto} from '@anatine/zod-nestjs';
import {extendApi} from '@anatine/zod-openapi';
import {ApiBody} from '@nestjs/swagger';
import { applyDecorators } from '@nestjs/common';

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

// Cache for storing generated DTOs
const dtoCache = new Map<ZodTypeAny, ReturnType<typeof createZodDto>>();
let dtoCounter = 0;

function getOrCreateDto(schema: ZodTypeAny) {
  if (!dtoCache.has(schema)) {
    const extendedSchema = extendApi(schema);
    const dto = createZodDto(extendedSchema, {
      name: `GeneratedDto${++dtoCounter}`
    });
    dtoCache.set(schema, dto);
  }
  return dtoCache.get(schema)!;
}

export function ZodBody(schema: ZodTypeAny): ParameterDecorator {
  return createParamDecorator(
    (data: unknown, ctx: ExecutionContext) => {
      const request = ctx.switchToHttp().getRequest();
      return new ZodValidationPipe(schema).transform(request.body);
    },
  )();
}

export function ApiZodBody(schema: ZodTypeAny) {
  const dtoClass = getOrCreateDto(schema);
  return ApiBody({ type: dtoClass });
}
