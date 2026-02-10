import {z} from 'zod';
import {createZodDto} from '@anatine/zod-nestjs';

const memorySchema = z.object({
  // eslint-disable-next-line sonarjs/no-duplicate-string
  workingSetSize: z.number().describe('Current amount of memory used by the process in Bytes. This is actual memory currently resident in RAM that belongs to this process'),
  peakWorkingSetSize: z.number().describe('Maximum Amount of physical Ram the process has ever used'),
  privateUsage: z.string().describe('Memory that is private to this process (not shareable with other processes). E.g. heap/stacks'),
  pageFileUsage: z.boolean().describe('Total virtual memory used by the process (including paged to disk)'),
}).describe('Process information');

const timesSchema = z.object({
  // eslint-disable-next-line sonarjs/no-duplicate-string
  creationTime: z.number().describe('100-nanoseconds since 1601-01-01 (Windows FILETIME format)'),
  kernelTime: z.number().describe('Total time the process has spent executing in kernel mode (100-nanoseconds)'),
  userTime: z.string().describe('Total time the process has spend executing in user mode'),
}).describe('Process information. TotalCPU time = kernelTime + userTime');

const processSchema = z.object({
  // eslint-disable-next-line sonarjs/no-duplicate-string
  pid: z.number().describe('Process ID'),
  parentPid: z.number().describe('Parent process ID'),
  path: z.string().describe('Executable file path'),
  isElevated: z.boolean().describe('Whether proces has admin permissions'),
  threadCount: z.number().describe('Total threads count created by this process'),
  memory: memorySchema,
  times: timesSchema,
  wids: z.array(z.number()).describe('List of all windows id of the process'),
}).describe('Process information');

class ProcessResponseDto extends createZodDto(processSchema) {}


const launchExeRequestSchema = z.object({
  path: z.string().describe('Path to executable'),
  arguments: z.array(z.string()).describe('Command line arguments'),
  waitTillFinish: z.boolean().describe('Wait for process to finish'),
});

const executableNameRequestSchema = z.object({
  name: z.string().regex(/[a-zA-Z0-9._ -]/u).describe('Process name. Allows only specific symbols due to security reasons'),
});

const createProcessRequestSchema = z.object({
  path: z.string().describe('Executable file path to start'),
  cmd: z.string().optional().describe('Optional command line string'),
}).describe('Create a new process and return its PID');

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
class CreateProcessRequestDto extends createZodDto(createProcessRequestSchema) {}

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
type CreateProcessRequest = z.infer<typeof createProcessRequestSchema>;// Export types
type FocusExeRequest = z.infer<typeof pidSchema>;

export {
  pidSchema,
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
  CreateProcessRequestDto,
  createProcessRequestSchema,
};

export type {
  FocusExeRequest,
  CreateProcessRequest,
  LaunchExeRequest,
  KillExeByNameRequest,
  KillExeByPidRequest,
  LaunchPidResponse,
  FindExeByNameRequest,
  ProcessIdResponse,
  WindowHandleResponse,
};
