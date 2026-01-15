import {z} from 'zod';
import {createZodDto} from '@anatine/zod-nestjs';

const processIdResponseSchema = z.object({
  pid: z.number().describe('Process ID'),
}).describe('Process ID');

const windowHandleResponseSchema = z.object({
  wid: z.number().describe('Window handle (HWND as number)'),
}).describe('Window handle');

class ProcessIdResponseDto extends createZodDto(processIdResponseSchema) {}
class WindowHandleResponseDto extends createZodDto(windowHandleResponseSchema) {}

type ProcessIdResponse = z.infer<typeof processIdResponseSchema>;
type WindowHandleResponse = z.infer<typeof windowHandleResponseSchema>;

export {
  processIdResponseSchema,
  windowHandleResponseSchema,
  ProcessIdResponseDto,
  WindowHandleResponseDto,
};

export type {
  ProcessIdResponse,
  WindowHandleResponse,
};
