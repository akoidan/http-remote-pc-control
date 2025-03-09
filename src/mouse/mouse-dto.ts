import {z} from 'zod';

const mouseMoveClickRequestSchema = z.object({
  x: z.number(),
  y: z.number(),
});

type MouseMoveClickRequest = z.infer<typeof mouseMoveClickRequestSchema>

export {
  mouseMoveClickRequestSchema,
};

export type {
  MouseMoveClickRequest,
};
