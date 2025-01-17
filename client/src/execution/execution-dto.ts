import {z} from 'zod';


const launchExeRequestSchema = z.object({
  path: z.string(),
  arguments: z.array(z.string()),
  waitTillFinish: z.boolean(),
});
type LaunchExeRequest = z.infer<typeof launchExeRequestSchema>;

const killExeRequestSchema = z.object({
  name: z.string(),
});

type KillExeRequest = z.infer<typeof killExeRequestSchema>

export {
  launchExeRequestSchema,
  killExeRequestSchema,
};

export type {
  KillExeRequest,
  LaunchExeRequest,
};
