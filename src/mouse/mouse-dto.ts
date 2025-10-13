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
  destinationRandomX: z.number()
    .int()
    .min(0)
    .describe('Maximum random offset in pixels from the target X coordinate. Adds natural imprecision to final position.')
    .default(0)
    .optional(),
  destinationRandomY: z.number()
    .int()
    .min(0)
    .describe('Maximum random offset in pixels from the target Y coordinate. Adds natural imprecision to final position.')
    .default(0)
    .optional(),
  delayBetweenIterations: z.number()
    .int()
    .min(1)
    .max(999)
    .describe('Base delay between movements in milliseconds. Actual delay will vary randomly between 80% and 120% of this value.')
    .default(5)
    .optional(),
  pixelsPerIteration: z.number()
    .int()
    .min(5)
    .max(200)
    .describe('Approximate number of pixels between movement updates. Lower values make movement smoother but slower.')
    .default(50)
    .optional(),
  curveIntensity: z.number()
    .min(0.1)
    .max(1)
    .describe('Base intensity of the curve. 0.1 is nearly straight, 1.0 allows for significant curves.')
    .default(0.3)
    .optional(),
  curveIntensityDeviation: z.number()
    .min(0)
    .max(0.5)
    .describe('Amount of random variation in curve intensity. 0 = no variation, 0.5 = ±50% variation')
    .default(0.2)
    .optional(),
  movementVariance: z.number()
    .min(0.1)
    .max(1)
    .describe('Controls how much the speed varies during movement. Higher values create more natural speed variations.')
    .default(0.4)
    .optional(),
  tremorIntensity: z.number()
    .min(0)
    .max(2)
    .describe('Adds subtle random movements to simulate natural hand tremor. 0 = no tremor, 2 = very shaky.')
    .default(0.5)
    .optional(),
}).strict()
  .describe('Request to move mouse with human-like movement. The movement follows a natural curved path with smooth acceleration and deceleration. ' +
  'The path includes subtle variations to mimic human motor control, with configurable curve intensity and movement variance.');

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
