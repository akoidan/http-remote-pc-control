import {z} from 'zod';
import {createZodDto} from '@anatine/zod-nestjs';

const pingResponseSchema = z.object({
  status: z.literal('ok').describe('Ping status'),
  version: z.string().describe('Application version'),
}).describe('Ping response');

class PingResponseDto extends createZodDto(pingResponseSchema) {}

type PingResponse = z.infer<typeof pingResponseSchema>;

export {
  pingResponseSchema,
  PingResponseDto,
};

export type {
  PingResponse,
};
