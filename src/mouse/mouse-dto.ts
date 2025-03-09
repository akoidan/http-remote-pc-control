import {z} from 'zod';
import {createZodDto} from '@anatine/zod-nestjs';

const mouseMoveClickRequestSchema = z.object({
  x: z.number(),
  y: z.number(),
});

// Create DTO class for Swagger
export class MouseMoveClickRequestDto extends createZodDto(mouseMoveClickRequestSchema) {}

// Export type and schema
export type MouseMoveClickRequest = z.infer<typeof mouseMoveClickRequestSchema>;
export {mouseMoveClickRequestSchema};
