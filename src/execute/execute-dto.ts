import {z} from 'zod';
import {createZodDto} from 'nestjs-zod';


const launchExeRequestSchema = z.object({
  path: z.string(),
  arguments: z.array(z.string()),
  waitTillFinish: z.boolean(),
});

const focusExeRequestSchema = z.object({
  pid: z.number(),
});


const killExeByNameRequestSchema = z.object({
  name: z.string(),
});

const killExeByPidRequestSchema = z.object({
  pid: z.number(),
});

type KillExeByNameRequest = z.infer<typeof killExeByNameRequestSchema>
type KillExeByPidRequest = z.infer<typeof killExeByPidRequestSchema>
type LaunchExeRequest = z.infer<typeof launchExeRequestSchema>;
type FocusExeRequest = z.infer<typeof focusExeRequestSchema>;


const launchPidResponse = z.object({
  pid: z.number().describe('Process Id'),
});


class LaunchExeRequestClass extends createZodDto(launchExeRequestSchema) {}
class KillExeByNameRequestClass extends createZodDto(killExeByNameRequestSchema) {}
class KillExeByPidRequestClass extends createZodDto(killExeByPidRequestSchema) {}
class FocusExeRequestClass extends createZodDto(focusExeRequestSchema) {}
class LaunchPidReponseClass extends createZodDto(launchPidResponse) {}
class LaunchPidResponseClass extends createZodDto(launchPidResponse) {}

export {
  launchExeRequestSchema,
  killExeByNameRequestSchema,
  killExeByPidRequestSchema,
  focusExeRequestSchema,
  launchPidResponse,
};


export type {
  LaunchExeRequestClass,
  KillExeByNameRequestClass,
  KillExeByPidRequestClass,
  LaunchPidResponseClass,
  FocusExeRequestClass,
  LaunchPidReponseClass,
  FocusExeRequest,
  KillExeByNameRequest,
  KillExeByPidRequest,
  LaunchExeRequest,
};
