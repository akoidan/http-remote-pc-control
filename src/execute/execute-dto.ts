import {z} from 'zod';
import {createZodDto} from '@anatine/zod-nestjs';

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

// Create DTO classes for Swagger
class LaunchExeRequestDto extends createZodDto(launchExeRequestSchema) {}
class KillExeByNameRequestDto extends createZodDto(executableNameRequestSchema) {}
class FindExeByNameRequestDto extends createZodDto(executableNameRequestSchema) {}
class KillExeByPidRequestDto extends createZodDto(processIdRequestSchema) {}
class LaunchPidResponseDto extends createZodDto(processIdRequestSchema) {}

// Export types for TypeScript
type LaunchExeRequest = z.infer<typeof launchExeRequestSchema>;
type KillExeByNameRequest = z.infer<typeof executableNameRequestSchema>;
type FindExeByNameRequest = z.infer<typeof executableNameRequestSchema>;
type KillExeByPidRequest = z.infer<typeof processIdRequestSchema>;
type LaunchPidResponse = z.infer<typeof processIdRequestSchema>;

export type {
  LaunchExeRequest,
  KillExeByNameRequest,
  KillExeByPidRequest,
  LaunchPidResponse,
  FindExeByNameRequest,
};


export {
  launchExeRequestSchema,
  processIdRequestSchema,
  executableNameRequestSchema,
  LaunchExeRequestDto,
  FindExeByNameRequestDto,
  KillExeByNameRequestDto,
  KillExeByPidRequestDto,
  LaunchPidResponseDto,
};
