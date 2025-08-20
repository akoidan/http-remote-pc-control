import {z} from 'zod';
import {createZodDto} from '@anatine/zod-nestjs';

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

// Create DTO class for Swagger
class FocusExeRequestDto extends createZodDto(pidSchema) {
}

class WindowsIdsResponseDto extends createZodDto(windowsSchema) {
}

class ActiveWindowResponseDto extends createZodDto(activeWindowSchema) {
}


class FocusWindowRequestDto extends createZodDto(widSchema) {
}

// Export types
type FocusExeRequest = z.infer<typeof pidSchema>;
type GetPidWindowsRequest = z.infer<typeof widSchema>;
type GetPidWindowsResponse = z.infer<typeof windowsSchema>;
type GetActiveWindowResponse = z.infer<typeof activeWindowSchema>;

export {
  pidSchema,
  widSchema,
  windowsSchema,
  activeWindowSchema,
  FocusExeRequestDto,
  FocusWindowRequestDto,
  WindowsIdsResponseDto,
  ActiveWindowResponseDto,
};

export type {
  GetPidWindowsResponse,
  GetActiveWindowResponse,
  GetPidWindowsRequest,
  FocusExeRequest,
};
