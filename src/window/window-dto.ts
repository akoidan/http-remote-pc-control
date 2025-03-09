import {z} from 'zod';
import {createZodDto} from '@anatine/zod-nestjs';

const focusExeRequestSchema = z.object({
  pid: z.number().describe('Process ID to focus'),
});

// Create DTO class for Swagger
class FocusExeRequestDto extends createZodDto(focusExeRequestSchema) {}

// Export values
export {focusExeRequestSchema, FocusExeRequestDto};

// Export types
export type FocusExeRequest = z.infer<typeof focusExeRequestSchema>;
