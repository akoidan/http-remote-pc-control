import {PipeTransform, Injectable, ArgumentMetadata, BadRequestException} from '@nestjs/common';
import {ZodSchema} from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  transform(value: unknown, metadata: ArgumentMetadata) {
    try {
      const zodSchema = metadata.metatype as ZodSchema;
      if (!zodSchema) {
        return value;
      }
      return zodSchema.parse(value);
    } catch (error) {
      throw new BadRequestException('Validation failed');
    }
  }
}
