import {z} from 'zod';


const launchExeRequestSchema = z.object({
  path: z.string(),
  arguments: z.array(z.string()),
  waitTillFinish: z.boolean(),
});

const focusExeRequestSchema = z.object({
  pid: z.number(),
});


const killExeRequestSchema = z.object({
  name: z.string(),
});

type KillExeRequest = z.infer<typeof killExeRequestSchema>
type LaunchExeRequest = z.infer<typeof launchExeRequestSchema>;
type FocusExeRequest = z.infer<typeof focusExeRequestSchema>;

interface LaunchPidResponse {
  pid: number;
}

export {
  launchExeRequestSchema,
  killExeRequestSchema,
  focusExeRequestSchema,
};

export type {
  LaunchPidResponse,
  FocusExeRequest,
  KillExeRequest,
  LaunchExeRequest,
};
