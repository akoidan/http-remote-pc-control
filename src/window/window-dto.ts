/* eslint-disable max-lines */

import {z} from 'zod';
import {createZodDto} from '@anatine/zod-nestjs';
import {WindowAction} from '@/native/native-model';

const boundsSchema = z.object({
  x: z.number().describe('Left position in screen coordinates (pixels)'),
  y: z.number().describe('Top position in screen coordinates (pixels)'),
  width: z.number().describe('Window width in pixels'),
  height: z.number().describe('Window height in pixels'),
}).describe('Rectangle bounds for a window');

const widSchema = z.number().describe('Target window handle (HWND as number)');

const getWindowResponseShema = z.object({
  bounds: boundsSchema,
  wid: widSchema,
  pid: z.number().optional().describe('Process ID of the active window'),
  path: z.string().optional().describe('Absolute path to the process executable for the active window'),
  parentWid: z.number().describe('Parent window id'),
  opacity: z.number().min(0).max(1).describe('Opacity value in range 0..1 where 1 is fully opaque'),
  title: z.string().describe('Window title'),
});

const setWindowsPropertiesRequestSchema = z.object({
  bounds: boundsSchema.optional(),
  state: z.nativeEnum(WindowAction).optional().describe('Action to apply: show | hide | minimize | restore | maximize'),
  opacity: z.number().min(0).max(1).optional().describe('Opacity value in range 0..1 where 1 is fully opaque'),
});


class SetWindowPropertiesRequestDto extends createZodDto(setWindowsPropertiesRequestSchema) {}
class GetWindowResponseDto extends createZodDto(getWindowResponseShema) {}


type SetWindowPropertiesRequest = z.infer<typeof setWindowsPropertiesRequestSchema>;
type WindowResponse = z.infer<typeof getWindowResponseShema>;


export {
  boundsSchema,
  setWindowsPropertiesRequestSchema,
  GetWindowResponseDto,
  SetWindowPropertiesRequestDto,
};

export type {
  WindowResponse,
  SetWindowPropertiesRequest,
};
