import {z} from 'zod';

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


const launchPidResponseSchema = z.object({
  pid: z.number().describe('Process Id'),
});

type KillExeByNameRequest = z.infer<typeof killExeByNameRequestSchema>
type KillExeByPidRequest = z.infer<typeof killExeByPidRequestSchema>
type LaunchExeRequest = z.infer<typeof launchExeRequestSchema>;
type FocusExeRequest = z.infer<typeof focusExeRequestSchema>;
type LaunchPidResponse = z.infer<typeof launchPidResponseSchema>;

export {
  launchExeRequestSchema,
  killExeByNameRequestSchema,
  killExeByPidRequestSchema,
  focusExeRequestSchema,
  launchPidResponseSchema,
};

export type {
  LaunchPidResponse,
  FocusExeRequest,
  KillExeByNameRequest,
  KillExeByPidRequest,
  LaunchExeRequest,
};
