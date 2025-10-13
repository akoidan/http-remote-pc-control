import {z} from 'zod';
import {createZodDto} from '@anatine/zod-nestjs';

const mouseMoveClickRequestSchema = z.object({
  x: z.number().describe('X coordinate to move mouse to'),
  y: z.number().describe('Y coordinate to move mouse to'),
});

const mousePositionResponseSchema = z.object({
  x: z.number().describe('X coordinate of mouse position'),
  y: z.number().describe('Y coordinate of mouse position'),
});


const mouseMoveHumanClickRequestSchema = z.object({
  x: z.number().describe('X coordinate to move mouse to'),
  y: z.number().describe('Y coordinate to move mouse to'),
  jitter: z.number()
    .min(0)
    .describe('Random offset to the movement path, so it’s not perfectly straight or robotic. ' +
      'Prefer passing smaller values like 2px, so is +-2px for x and y' +
      'Since coordination between is not integers the real number can be passed. Values higher than 2 creates too much mess usually')
    .default(2)
    .optional(),
  destinationRandomX: z.number()
    .int()
    .describe('Diapason in px around the target zone to be clicked. If 0 is passed x,y will be the final click position')
    .default(0)
    .optional(),
  destinationRandomY: z.number()
    .int()
    .describe('Diapason in px around the target zone to be clicked. If 0 is passed x,y will be the final click position')
    .default(0)
    .optional(),
  slowness: z.number()
    .int()
    .min(0)
    .describe('Delay between each iteration in ms. The value is gonna be random from 1ms to this number. When 0, its always 1ms. if 7 its 8ms between moves')
    .default(7)
    .optional(),
  iterations: z.number()
    .int()
    .min(0)
    .describe('Number of iteration per 100px of movement.')
    .default(3)
    .optional(),
  iterationDeviation: z.number()
    .describe('Deviation of iteration. E.g. if 0.2 is passed or omitted the number iteration per 100px is gonna be between 80 and 120')
    .max(1)
    .min(0)
    .default(0.2)
    .optional(),
});

// Create DTO class for Swagger
class MouseMoveClickRequestDto extends createZodDto(mouseMoveClickRequestSchema) {}
class MouseMoveHumanClickRequestDto extends createZodDto(mouseMoveHumanClickRequestSchema) {}
class MousePositionResponseDto extends createZodDto(mousePositionResponseSchema) {}

type MouseMoveHumanClickRequest = z.infer<typeof mouseMoveHumanClickRequestSchema>;
type MousePositionResponse = z.infer<typeof mousePositionResponseSchema>;

// Export values
export {mouseMoveClickRequestSchema, MouseMoveClickRequestDto, mouseMoveHumanClickRequestSchema, MousePositionResponseDto};


export type {
  MouseMoveHumanClickRequestDto, MouseMoveHumanClickRequest, MousePositionResponse,
}
