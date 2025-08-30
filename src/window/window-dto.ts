import {z} from 'zod';
import {createZodDto} from '@anatine/zod-nestjs';
import {WindowAction} from '@/native/native-model';

const pidSchema = z.object({
  pid: z.number().describe('Process ID to focus'),
});

const widSchema = z.object({
  wid: z.number().describe('Window ID'),
});

const windowsSchema = z.object({
  wids: z.array(z.number()).describe('Array of windows ids for process id'),
});

const activeWindowSchema = z.object({
  path: z.string().describe('Name of the process that owns this window'),
  wid: z.number().describe('Window Id'),
  pid: z.number().describe('Process Id'),
});

// New schemas for extended window operations
const boundsSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
});

const setBoundsRequestSchema = z.object({
  wid: z.number(),
  bounds: boundsSchema,
});

const showWindowRequestSchema = z.object({
  wid: z.number(),
  type: z.nativeEnum(WindowAction),
});

const setOpacityRequestSchema = z.object({
  wid: z.number(),
  opacity: z.number().min(0).max(1),
});

const toggleTransparencyRequestSchema = z.object({
  wid: z.number(),
  toggle: z.boolean(),
});

const setOwnerRequestSchema = z.object({
  wid: z.number(),
  owner: z.number(),
});

const createProcessRequestSchema = z.object({
  path: z.string(),
  cmd: z.string().optional(),
});

// Create DTO class for Swagger
class FocusExeRequestDto extends createZodDto(pidSchema) {}
class WindowsIdsResponseDto extends createZodDto(windowsSchema) {}
class ActiveWindowResponseDto extends createZodDto(activeWindowSchema) {}
class FocusWindowRequestDto extends createZodDto(widSchema) {}

// New DTOs
class SetBoundsRequestDto extends createZodDto(setBoundsRequestSchema) {}
class ShowWindowRequestDto extends createZodDto(showWindowRequestSchema) {}
class SetOpacityRequestDto extends createZodDto(setOpacityRequestSchema) {}
class ToggleTransparencyRequestDto extends createZodDto(toggleTransparencyRequestSchema) {}
class SetOwnerRequestDto extends createZodDto(setOwnerRequestSchema) {}
class CreateProcessRequestDto extends createZodDto(createProcessRequestSchema) {}

// Response DTOs for Swagger
class BoundsResponseDto extends createZodDto(boundsSchema) {}

// Export types
type FocusExeRequest = z.infer<typeof pidSchema>;
type GetPidWindowsRequest = z.infer<typeof widSchema>;
type GetPidWindowsResponse = z.infer<typeof windowsSchema>;
type GetActiveWindowResponse = z.infer<typeof activeWindowSchema>;
type Bounds = z.infer<typeof boundsSchema>;

type SetBoundsRequest = z.infer<typeof setBoundsRequestSchema>;
type ShowWindowRequest = z.infer<typeof showWindowRequestSchema>;
type SetOpacityRequest = z.infer<typeof setOpacityRequestSchema>;
type ToggleTransparencyRequest = z.infer<typeof toggleTransparencyRequestSchema>;
type SetOwnerRequest = z.infer<typeof setOwnerRequestSchema>;
type CreateProcessRequest = z.infer<typeof createProcessRequestSchema>;

export {
  pidSchema,
  widSchema,
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
};

export type {
  GetPidWindowsResponse,
  GetActiveWindowResponse,
  GetPidWindowsRequest,
  FocusExeRequest,
  Bounds,
  SetBoundsRequest,
  ShowWindowRequest,
  SetOpacityRequest,
  ToggleTransparencyRequest,
  SetOwnerRequest,
  CreateProcessRequest,
};
