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
      'Prefer passing smaller values like 1.5px, so is +-1.5px for x and y' +
      'Since coordination between is not integers the real number can be passed. Values higher than 2 creates too much mess usually')
    .default(1.5)
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
  delayBetweenIterations: z.number()
    .int()
    .min(1)
    .describe('Delay between each iteration in ms. The value is gonna be random from 1ms to this number.')
    .default(8)
    .optional(),
  pixelsPerIterations: z.number()
    .int()
    .min(1)
    .describe('Number of pixels to execute in a single straight line move. ')
    .default(50)
    .optional(),
  pixelsPerIterationsDeviation: z.number()
    .describe('Number of pixels required to add an extra iteration.E.g. if mose should be moved to 1000px and this param is set to 100. The number of iterations would be 10. Affects movement speed.')
    .min(0)
    .max(1)
    .default(0.2)
    .optional(),
}).strict()
  .describe('Request to move mouse with a human like movement. THe movement would be done in almost a straight line with accelerating at the start and slowing in the end. ' +
  'The speed can be adjust with delayBetweenIteration. The number of straight line movement with delays with pixelsPerIterations.');

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
