import {z} from 'zod';
import {createZodDto} from '@anatine/zod-nestjs';
import {WindowAction} from '@/native/native-model';

const pidSchema = z.object({
  pid: z.number().describe('Process ID whose top-level window should receive focus'),
}).describe('Focus window by process ID');

const widObjectSchema = z.object({
  wid: z.number().describe('Window handle (HWND as number)'),
}).describe('Target a specific window by handle');

const windowsSchema = z.object({
  wids: z.array(z.number().describe('Window handle (HWND as number)')).describe('Handles of all windows belonging to the specified process'),
}).describe('List of window handles for a process');

const activeWindowSchema = z.object({
  path: z.string().describe('Absolute path to the process executable for the active window'),
  wid: z.number().describe('Active window handle (HWND as number)'),
  pid: z.number().describe('Process ID of the active window'),
}).describe('Information about the current foreground window');

// New schemas for extended window operations
const boundsSchema = z.object({
  x: z.number().describe('Left position in screen coordinates (pixels)'),
  y: z.number().describe('Top position in screen coordinates (pixels)'),
  width: z.number().describe('Window width in pixels'),
  height: z.number().describe('Window height in pixels'),
}).describe('Rectangle bounds for a window');

const widSchema = z.number().describe('Target window handle (HWND as number)');

const setBoundsRequestSchema = z.object({
  wid: widSchema,
  bounds: boundsSchema.describe('New window rectangle to apply'),
}).describe('Set window position and size');

const showWindowRequestSchema = z.object({
  wid: widSchema,
  type: z.nativeEnum(WindowAction).describe('Action to apply: show | hide | minimize | restore | maximize'),
}).describe('Show/Hide/Minimize/Restore/Maximize a window');

const setOpacityRequestSchema = z.object({
  wid: widSchema,
  opacity: z.number().min(0).max(1).describe('Opacity value in range 0..1 where 1 is fully opaque'),
}).describe('Set layered window opacity');

const toggleTransparencyRequestSchema = z.object({
  wid: widSchema,
  toggle: z.boolean().describe('If true: set WS_EX_LAYERED flag; if false: remove it'),
}).describe('Toggle WS_EX_LAYERED transparency style flag');

const setOwnerRequestSchema = z.object({
  wid: z.number().describe('Child window handle (HWND as number)'),
  owner: z.number().describe('New owner window handle (HWND as number) or 0 to clear'),
}).describe('Set window owner (GWLP_HWNDPARENT)');

const createProcessRequestSchema = z.object({
  path: z.string().describe('Executable file path to start'),
  cmd: z.string().optional().describe('Optional command line string'),
}).describe('Create a new process and return its PID');

// Create DTO class for Swagger
class FocusExeRequestDto extends createZodDto(pidSchema) {}
class WindowsIdsResponseDto extends createZodDto(windowsSchema) {}
class ActiveWindowResponseDto extends createZodDto(activeWindowSchema) {}
class FocusWindowRequestDto extends createZodDto(widObjectSchema) {}

// New DTOs
class SetBoundsRequestDto extends createZodDto(setBoundsRequestSchema) {}
class ShowWindowRequestDto extends createZodDto(showWindowRequestSchema) {}
class SetOpacityRequestDto extends createZodDto(setOpacityRequestSchema) {}
class ToggleTransparencyRequestDto extends createZodDto(toggleTransparencyRequestSchema) {}
class SetOwnerRequestDto extends createZodDto(setOwnerRequestSchema) {}
class CreateProcessRequestDto extends createZodDto(createProcessRequestSchema) {}

// Response DTOs for Swagger
class BoundsResponseDto extends createZodDto(boundsSchema) {}

// New response schemas for primitive-returning endpoints
const activeWindowIdResponseSchema = z.object({
  wid: z.number().describe('Active window handle (HWND as number)'),
}).describe('Active window id (raw handle)');

const windowTitleResponseSchema = z.object({
  title: z.string().describe('Window title string'),
}).describe('Window title');

const windowOpacityResponseSchema = z.object({
  opacity: z.number().min(0).max(1).describe('Opacity value in range 0..1'),
}).describe('Window opacity');

const windowOwnerResponseSchema = z.object({
  owner: z.number().describe('Owner window handle (HWND as number) or 0 if none'),
}).describe('Window owner handle');

class ActiveWindowIdResponseDto extends createZodDto(activeWindowIdResponseSchema) {}
class WindowTitleResponseDto extends createZodDto(windowTitleResponseSchema) {}
class WindowOpacityResponseDto extends createZodDto(windowOpacityResponseSchema) {}
class WindowOwnerResponseDto extends createZodDto(windowOwnerResponseSchema) {}

// Export types
type FocusExeRequest = z.infer<typeof pidSchema>;
type GetPidWindowsRequest = z.infer<typeof widObjectSchema>;
type GetPidWindowsResponse = z.infer<typeof windowsSchema>;
type GetActiveWindowResponse = z.infer<typeof activeWindowSchema>;
type Bounds = z.infer<typeof boundsSchema>;
type ActiveWindowIdResponse = z.infer<typeof activeWindowIdResponseSchema>;
type WindowTitleResponse = z.infer<typeof windowTitleResponseSchema>;
type WindowOpacityResponse = z.infer<typeof windowOpacityResponseSchema>;
type WindowOwnerResponse = z.infer<typeof windowOwnerResponseSchema>;

type SetBoundsRequest = z.infer<typeof setBoundsRequestSchema>;
type ShowWindowRequest = z.infer<typeof showWindowRequestSchema>;
type SetOpacityRequest = z.infer<typeof setOpacityRequestSchema>;
type ToggleTransparencyRequest = z.infer<typeof toggleTransparencyRequestSchema>;
type SetOwnerRequest = z.infer<typeof setOwnerRequestSchema>;
type CreateProcessRequest = z.infer<typeof createProcessRequestSchema>;

export {
  pidSchema,
  widObjectSchema,
  windowsSchema,
  activeWindowSchema,
  boundsSchema,
  setBoundsRequestSchema,
  showWindowRequestSchema,
  setOpacityRequestSchema,
  toggleTransparencyRequestSchema,
  setOwnerRequestSchema,
  createProcessRequestSchema,
  FocusExeRequestDto,
  FocusWindowRequestDto,
  WindowsIdsResponseDto,
  ActiveWindowResponseDto,
  SetBoundsRequestDto,
  ShowWindowRequestDto,
  SetOpacityRequestDto,
  ToggleTransparencyRequestDto,
  SetOwnerRequestDto,
  CreateProcessRequestDto,
  BoundsResponseDto,
  ActiveWindowIdResponseDto,
  WindowTitleResponseDto,
  WindowOpacityResponseDto,
  WindowOwnerResponseDto,
};

export type {
  GetPidWindowsResponse,
  GetActiveWindowResponse,
  GetPidWindowsRequest,
  FocusExeRequest,
  Bounds,
  ActiveWindowIdResponse,
  WindowTitleResponse,
  WindowOpacityResponse,
  WindowOwnerResponse,
  SetBoundsRequest,
  ShowWindowRequest,
  SetOpacityRequest,
  ToggleTransparencyRequest,
  SetOwnerRequest,
  CreateProcessRequest,
};
