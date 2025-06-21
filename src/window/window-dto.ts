import {z} from 'zod';
import {createZodDto} from '@anatine/zod-nestjs';

const pidSchema = z.object({
  pid: z.number().describe('Process ID to focus'),
});

const widSchema = z.object({
  wid: z.number().describe('Window ID'),
});

const windowsSchema = z.object({
  ids: z.array(z.number()).describe('Array of windows ids for process id'),
});

// Create DTO class for Swagger
class FocusExeRequestDto extends createZodDto(pidSchema) {
}

class WindowsIdsResponseDto extends createZodDto(windowsSchema) {
}

class FocusWindowRequestDto extends createZodDto(widSchema) {
}

// Export types
type FocusExeRequest = z.infer<typeof pidSchema>;
type GetPidWindowsRequest = z.infer<typeof widSchema>;
type GetPidWindowsResponse = z.infer<typeof windowsSchema>;

export {
  pidSchema,
  widSchema,
  windowsSchema,
  FocusExeRequestDto,
  FocusWindowRequestDto,
  WindowsIdsResponseDto,
};

export type {
  GetPidWindowsResponse,
  GetPidWindowsRequest,
  FocusExeRequest,
};
