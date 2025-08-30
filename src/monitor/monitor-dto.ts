import {z} from 'zod';
import {createZodDto} from '@anatine/zod-nestjs';

const monitorsListSchema = z.array(z.number());

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

class MonitorsListResponseDto extends createZodDto(monitorsListSchema) {}
class MonitorInfoResponseDto extends createZodDto(monitorInfoSchema) {}

export {
  monitorsListSchema,
  monitorBoundsSchema,
  monitorInfoSchema,
  MonitorsListResponseDto,
  MonitorInfoResponseDto,
};
