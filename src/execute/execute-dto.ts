import {z} from 'zod';
import {createZodDto} from '@anatine/zod-nestjs';

const launchExeRequestSchema = z.object({
  path: z.string().describe('Path to executable'),
  arguments: z.array(z.string()).describe('Command line arguments'),
  waitTillFinish: z.boolean().describe('Wait for process to finish'),
});

const focusExeRequestSchema = z.object({
  pid: z.number().describe('Process ID to focus'),
});

const killExeByNameRequestSchema = z.object({
  name: z.string().describe('Process name to kill'),
});

const killExeByPidRequestSchema = z.object({
  pid: z.number().describe('Process ID to kill'),
});

const launchPidResponseSchema = z.object({
  pid: z.number().describe('Process ID of launched executable'),
});

// Create DTO classes for Swagger
class LaunchExeRequestDto extends createZodDto(launchExeRequestSchema) {}
class FocusExeRequestDto extends createZodDto(focusExeRequestSchema) {}
class KillExeByNameRequestDto extends createZodDto(killExeByNameRequestSchema) {}
class KillExeByPidRequestDto extends createZodDto(killExeByPidRequestSchema) {}
class LaunchPidResponseDto extends createZodDto(launchPidResponseSchema) {}

// Export types for TypeScript
type LaunchExeRequest = z.infer<typeof launchExeRequestSchema>;
type FocusExeRequest = z.infer<typeof focusExeRequestSchema>;
type KillExeByNameRequest = z.infer<typeof killExeByNameRequestSchema>;
type KillExeByPidRequest = z.infer<typeof killExeByPidRequestSchema>;
type LaunchPidResponse = z.infer<typeof launchPidResponseSchema>;

export type {
  LaunchExeRequest,
  FocusExeRequest,
  KillExeByNameRequest,
  KillExeByPidRequest,
  LaunchPidResponse,
};


export {
  launchExeRequestSchema,
  focusExeRequestSchema,
  killExeByNameRequestSchema,
  killExeByPidRequestSchema,
  launchPidResponseSchema,
  LaunchExeRequestDto,
  FocusExeRequestDto,
  KillExeByNameRequestDto,
  KillExeByPidRequestDto,
  LaunchPidResponseDto,
};
