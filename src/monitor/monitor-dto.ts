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
  scale: z.number().describe('Monitor scale factor'),
  isPrimary: z.boolean().describe('True if this is the primary display'),
}).describe('Monitor information');

const monitorIdResponseSchema = z.object({
  mid: z.number().describe('Monitor ID'),
}).describe('Monitor ID');

class MonitorInfoResponseDto extends createZodDto(monitorInfoSchema) {}

type MonitorIdResponse = z.infer<typeof monitorIdResponseSchema>;

export {
  monitorBoundsSchema,
  monitorInfoSchema,
  monitorIdResponseSchema,
  MonitorInfoResponseDto,

};

export type {
  MonitorIdResponse,
  MonitorScaleFactorResponse,
};
