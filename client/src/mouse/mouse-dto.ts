import {z} from 'zod';

const mouseClickRequestSchema = z.object({
  x: z.number(),
  y: z.number(),
});

type MouseClickRequest = z.infer<typeof mouseClickRequestSchema>


export {
  mouseClickRequestSchema,
};

export type {
  MouseClickRequest,
};
