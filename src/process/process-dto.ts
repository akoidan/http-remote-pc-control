import {z} from 'zod';
import {createZodDto} from '@anatine/zod-nestjs';

const processIdResponseSchema = z.object({
  // eslint-disable-next-line sonarjs/no-duplicate-string
  pid: z.number().describe('Process ID'),
}).describe('Process ID');

const windowHandleResponseSchema = z.object({
  wid: z.number().describe('Window handle (HWND as number)'),
}).describe('Window handle');

class ProcessIdResponseDto extends createZodDto(processIdResponseSchema) {
}

class WindowHandleResponseDto extends createZodDto(windowHandleResponseSchema) {
}

type ProcessIdResponse = z.infer<typeof processIdResponseSchema>;
type WindowHandleResponse = z.infer<typeof windowHandleResponseSchema>;

const launchExeRequestSchema = z.object({
  path: z.string().describe('Path to executable'),
  arguments: z.array(z.string()).describe('Command line arguments'),
  waitTillFinish: z.boolean().describe('Wait for process to finish'),
});

const executableNameRequestSchema = z.object({
  name: z.string().regex(/[a-zA-Z0-9._ -]/u).describe('Process name. Allows only specific symbols due to security reasons'),
});

const processIdRequestSchema = z.object({
  pid: z.number().describe('Process ID'),
});

const processIdsReponseSchema = z.object({
  pids: z.array(z.number()).describe('List of processes Ids'),
});

// Create DTO classes for Swagger
class LaunchExeRequestDto extends createZodDto(launchExeRequestSchema) {
}

class KillExeByNameRequestDto extends createZodDto(executableNameRequestSchema) {
}

class FindExeByNameRequestDto extends createZodDto(executableNameRequestSchema) {
}

class KillExeByPidRequestDto extends createZodDto(processIdRequestSchema) {
}

class LaunchPidResponseDto extends createZodDto(processIdRequestSchema) {
}

class FindPidsByNameResponseDto extends createZodDto(processIdsReponseSchema) {
}

// Export types for TypeScript
type LaunchExeRequest = z.infer<typeof launchExeRequestSchema>;
type KillExeByNameRequest = z.infer<typeof executableNameRequestSchema>;
type FindExeByNameRequest = z.infer<typeof executableNameRequestSchema>;
type KillExeByPidRequest = z.infer<typeof processIdRequestSchema>;
type LaunchPidResponse = z.infer<typeof processIdRequestSchema>;

export {
  processIdsReponseSchema,
  launchExeRequestSchema,
  processIdRequestSchema,
  executableNameRequestSchema,
  LaunchExeRequestDto,
  FindExeByNameRequestDto,
  FindPidsByNameResponseDto,
  KillExeByNameRequestDto,
  KillExeByPidRequestDto,
  LaunchPidResponseDto,
  processIdResponseSchema,
  windowHandleResponseSchema,
  ProcessIdResponseDto,
  WindowHandleResponseDto,
};

export type {
  LaunchExeRequest,
  KillExeByNameRequest,
  KillExeByPidRequest,
  LaunchPidResponse,
  FindExeByNameRequest,
  ProcessIdResponse,
  WindowHandleResponse,
};
