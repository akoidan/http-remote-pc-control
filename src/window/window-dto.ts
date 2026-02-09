/* eslint-disable max-lines */

import {z} from 'zod';
import {createZodDto} from '@anatine/zod-nestjs';
import {WindowAction} from '@/native/native-model';


// New schemas for extended window operations
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
  pid: z.number().describe('Process ID of the active window'),
  path: z.string().describe('Absolute path to the process executable for the active window'),
  isVisible: z.boolean().describe('True if the window is visible'),
  owner: z.number().describe('Parent window id'),
  opacity: z.number().min(0).max(1).describe('Opacity value in range 0..1 where 1 is fully opaque'),
  title: z.string().describe('Window title'),
});


const setWindowsPropertiesRequestSchema = z.object({
  bounds: boundsSchema.optional(),
  visibility: z.nativeEnum(WindowAction).optional().describe('Action to apply: show | hide | minimize | restore | maximize'),
  opacity: z.number().min(0).max(1).optional().describe('Opacity value in range 0..1 where 1 is fully opaque'),
  transparency: z.boolean().optional().describe('If true: set WS_EX_LAYERED flag; if false: remove it'),
  owner: z.number().optional().describe('New owner window handle (HWND as number) or 0 to clear'),
});


const activeWindowIdResponseSchema = z.object({
  wid: z.number().describe('Active window handle (HWND as number)'),
}).describe('Active window ID');



// New DTOs
class SetWindowPropertiesRequestDto extends createZodDto(setWindowsPropertiesRequestSchema) {}


class GetWindowResponseDto extends createZodDto(getWindowResponseShema) {}



type Bounds = z.infer<typeof boundsSchema>;

type SetWindowPropertiesRequest = z.infer<typeof setWindowsPropertiesRequestSchema>;


type ActiveWindowIdResponse = z.infer<typeof activeWindowIdResponseSchema>;
type WindowResponse = z.infer<typeof getWindowResponseShema>;


export {
  boundsSchema,
  setWindowsPropertiesRequestSchema,
  activeWindowIdResponseSchema,
  GetWindowResponseDto,
  SetWindowPropertiesRequestDto,
};

export type {
  WindowResponse,
  Bounds,
  SetWindowPropertiesRequest,
  ActiveWindowIdResponse,
};
