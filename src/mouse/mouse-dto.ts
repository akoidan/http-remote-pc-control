import {z} from 'zod';
import {createZodDto} from '@anatine/zod-nestjs';

const mouseMoveClickRequestSchema = z.object({
  x: z.number().describe('X coordinate to move mouse to'),
  y: z.number().describe('Y coordinate to move mouse to'),
});

// Create DTO class for Swagger
class MouseMoveClickRequestDto extends createZodDto(mouseMoveClickRequestSchema) {}

// Export values
export {mouseMoveClickRequestSchema, MouseMoveClickRequestDto};

// Export types
export type MouseMoveClickRequest = z.infer<typeof mouseMoveClickRequestSchema>;
