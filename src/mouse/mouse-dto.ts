import {z} from 'zod';
import {createZodDto} from '@anatine/zod-nestjs';
import {MouseButton} from '@/native/native-model';

const mousePositionSchema = z.object({
  x: z.number().describe('X coordinate to move mouse to'),
  y: z.number().describe('Y coordinate to move mouse to'),
});

const mouseMoveHumanClickRequestSchema = z.object({
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
}).merge(mousePositionSchema).strict()
  .describe('Request to move mouse with human-like movement. The movement follows a natural curved path with smooth acceleration and deceleration. ' +
  'The path includes subtle variations to mimic human motor control, with configurable curve intensity and movement variance.');

const mouseButtonSchema = z.nativeEnum(MouseButton)
    .describe('Mouse button, left=1, right=2 , middle=3');

const mouseClickSchemaRequestSchema = z.object({
  button: mouseButtonSchema.default(MouseButton.LEFT),
}).describe('Request to perform a mouse button click');

// Create DTO class for Swagger
class MousePositionRRDto extends createZodDto(mousePositionSchema) {}
class MouseMoveHumanRequestDto extends createZodDto(mouseMoveHumanClickRequestSchema) {}
class MouseClickRequestDto extends createZodDto(mouseClickSchemaRequestSchema) {}

type MouseMoveHumanClickRequest = z.infer<typeof mouseMoveHumanClickRequestSchema>;
type MousePositionRR = z.infer<typeof mousePositionSchema>;
type MouseClickRequest = z.infer<typeof mouseClickSchemaRequestSchema>;

// Export values
export {
  mousePositionSchema,
  MousePositionRRDto,
  mouseButtonSchema,
  mouseMoveHumanClickRequestSchema,
  mouseClickSchemaRequestSchema,
  MouseClickRequestDto,
  MouseMoveHumanRequestDto,
};


export type {
  MouseMoveHumanClickRequest,
  MousePositionRR,
  MouseClickRequest,
};
