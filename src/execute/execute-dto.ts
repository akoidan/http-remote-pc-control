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
export class LaunchExeRequestDto extends createZodDto(launchExeRequestSchema) {}
export class FocusExeRequestDto extends createZodDto(focusExeRequestSchema) {}
export class KillExeByNameRequestDto extends createZodDto(killExeByNameRequestSchema) {}
export class KillExeByPidRequestDto extends createZodDto(killExeByPidRequestSchema) {}
export class LaunchPidResponseDto extends createZodDto(launchPidResponseSchema) {}

// Export types for TypeScript
export type LaunchExeRequest = z.infer<typeof launchExeRequestSchema>;
export type FocusExeRequest = z.infer<typeof focusExeRequestSchema>;
export type KillExeByNameRequest = z.infer<typeof killExeByNameRequestSchema>;
export type KillExeByPidRequest = z.infer<typeof killExeByPidRequestSchema>;
export type LaunchPidResponse = z.infer<typeof launchPidResponseSchema>;

// Export schemas for validation
export {
  launchExeRequestSchema,
  focusExeRequestSchema,
  killExeByNameRequestSchema,
  killExeByPidRequestSchema,
  launchPidResponseSchema,
};
