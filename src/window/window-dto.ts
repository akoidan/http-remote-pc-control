import {z} from 'zod';
import {createZodDto} from '@anatine/zod-nestjs';

const focusExeRequestSchema = z.object({
  pid: z.number().describe('Process ID to focus'),
});

// Create DTO class for Swagger
class FocusExeRequestDto extends createZodDto(focusExeRequestSchema) {
}

// Export types
type FocusExeRequest = z.infer<typeof focusExeRequestSchema>;

export {
  focusExeRequestSchema,
  FocusExeRequestDto,
};
export type {
  FocusExeRequest,
};
