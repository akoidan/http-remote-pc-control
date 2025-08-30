import {z} from 'zod';
import {createZodDto} from '@anatine/zod-nestjs';
import {ApiProperty} from '@nestjs/swagger';

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
class LaunchExeRequestDto {
  @ApiProperty({ description: 'Path to executable' })
  path!: string;

  @ApiProperty({ description: 'Command line arguments', type: [String] })
  arguments!: string[];

  @ApiProperty({ description: 'Wait for process to finish' })
  waitTillFinish!: boolean;
}
class KillExeByNameRequestDto extends createZodDto(executableNameRequestSchema) {}
class FindExeByNameRequestDto extends createZodDto(executableNameRequestSchema) {}
class KillExeByPidRequestDto extends createZodDto(processIdRequestSchema) {}
class LaunchPidResponseDto extends createZodDto(processIdRequestSchema) {}
class FindPidsByNameResponseDto extends createZodDto(processIdsReponseSchema) {}

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
};
