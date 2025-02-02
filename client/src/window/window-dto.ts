import {z} from 'zod';

const focusExeRequestSchema = z.object({
  pid: z.number(),
});

type FocusExeRequest = z.infer<typeof focusExeRequestSchema>;

export {
  focusExeRequestSchema,
};

export type {
  FocusExeRequest,
};
