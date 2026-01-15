import {z} from 'zod';
import {createZodDto} from '@anatine/zod-nestjs';


const monitorBoundsSchema = z.object({
  x: z.number().describe('Left position in screen coordinates (pixels)'),
  y: z.number().describe('Top position in screen coordinates (pixels)'),
  width: z.number().describe('Monitor width in pixels'),
  height: z.number().describe('Monitor height in pixels'),
}).describe('Monitor rectangle bounds');

const monitorInfoSchema = z.object({
  bounds: monitorBoundsSchema.describe('Full monitor bounds'),
  workArea: monitorBoundsSchema.describe('Usable desktop area excluding taskbar/docks'),
  isPrimary: z.boolean().describe('True if this is the primary display'),
}).describe('Monitor information');

const monitorIdResponseSchema = z.object({
  value: z.number().describe('Monitor ID'),
}).describe('Monitor ID');

const monitorScaleFactorResponseSchema = z.object({
  value: z.number().describe('Monitor scale factor'),
}).describe('Monitor scale factor');

class MonitorInfoResponseDto extends createZodDto(monitorInfoSchema) {}

class MonitorIdResponseDto extends createZodDto(monitorIdResponseSchema) {}
class MonitorScaleFactorResponseDto extends createZodDto(monitorScaleFactorResponseSchema) {}

type MonitorIdResponse = z.infer<typeof monitorIdResponseSchema>;
type MonitorScaleFactorResponse = z.infer<typeof monitorScaleFactorResponseSchema>;

export {
  monitorBoundsSchema,
  monitorInfoSchema,
  monitorIdResponseSchema,
  monitorScaleFactorResponseSchema,
  MonitorInfoResponseDto,
  MonitorIdResponseDto,
  MonitorScaleFactorResponseDto,
};

export type {
  MonitorIdResponse,
  MonitorScaleFactorResponse,
};
