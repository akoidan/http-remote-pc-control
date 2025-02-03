import { z } from 'zod';


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

interface LaunchPidResponse {
  pid: number;
}

export {
  launchExeRequestSchema,
  killExeByNameRequestSchema,
  killExeByPidRequestSchema,
  focusExeRequestSchema,
};

export type {
  LaunchPidResponse,
  FocusExeRequest,
  KillExeByNameRequest,
  KillExeByPidRequest,
  LaunchExeRequest,
};
