import {z} from 'zod';
import {createZodDto} from '@anatine/zod-nestjs';
import {ApiProperty} from '@nestjs/swagger';

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

class MonitorBoundsResponseDto {
  @ApiProperty() x!: number;
  @ApiProperty() y!: number;
  @ApiProperty() width!: number;
  @ApiProperty() height!: number;
}

class MonitorInfoResponseDto {
  @ApiProperty({ type: () => MonitorBoundsResponseDto }) bounds!: MonitorBoundsResponseDto;
  @ApiProperty({ type: () => MonitorBoundsResponseDto }) workArea!: MonitorBoundsResponseDto;
  @ApiProperty() isPrimary!: boolean;
}

export {
  monitorBoundsSchema,
  monitorInfoSchema,
  MonitorBoundsResponseDto,
  MonitorInfoResponseDto,
};
