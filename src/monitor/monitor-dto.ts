import {z} from 'zod';
import {createZodDto} from '@anatine/zod-nestjs';


const monitorBoundsSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
});

const monitorInfoSchema = z.object({
  bounds: monitorBoundsSchema,
  workArea: monitorBoundsSchema,
  isPrimary: z.boolean(),
});

class MonitorInfoResponseDto extends createZodDto(monitorInfoSchema) {}

export {
  monitorBoundsSchema,
  monitorInfoSchema,
  MonitorInfoResponseDto,
};
