import {
  z,
  ZodIssueCode,
} from 'zod';
import {
  commandSchema,
} from '@/config/types/commands';
import {commandOrMacroSchema} from '@/config/types/macros';


const commandsAndMacrosArraySchema = z.array(commandOrMacroSchema)
  .describe('A set of events that executed sequentially in this thread');// Define the schema for the 'combinations'

const commandWoMacroArraySchema = z.array(commandSchema).describe('A set of events that executed sequentially in this thread');

const baseShortCutMappingSchema = z.object({
  delay: z.number().optional().describe('Delay in milliseconds between commands for this shorcut'),
  name: z.string().describe('Name that is printed during startup with a shorcut'),
  shortCut: z.string().describe('A shorcut to be pressed. E.g. Alt+1'),
}).strict();

const commandsSchema = z.array(commandSchema);
const shortcutMappingWithMacroSchema = z.object({
  commands: commandsAndMacrosArraySchema.optional().describe('List of commands for different commands'),
  threads: z.array(commandsAndMacrosArraySchema).optional()
    .describe('This option should be defined only if commands attribute is absent.' +
      ' Same as commands but array of arrays of commands. Top level of array executes in parallel'),
})
  .strict().merge(baseShortCutMappingSchema).refine(
    (data) =>
      (data.commands && !data.threads) ?? (!data.commands && data.threads),
    {
      message: 'Either commands or threads must be present, but not both.',
      path: ['commands', 'threads'], // Error will be shown for both fields
    }
  );

const randomShortCutMappingSchema = z.object({
  circular: z.boolean().optional().describe('If set to true. Commands in this chain will be executed in a circular way.' +
    ' So each press = 1 command. Instead of full commands'),
  shuffle: z.boolean().optional().describe('If circular set to true, commands in this event would be executed randomly by 1'),
  commands: z.array(commandSchema).describe('List of commands for different commands'),
})
  .merge(baseShortCutMappingSchema)
  .describe('An event schema that represent a set of commands that is executed when a certain shortkey is pressed');


const threadCircularShortCutMappingSchema = z.object({
  threadsCircular: z.array(commandWoMacroArraySchema)
    .describe('Similar to circular in commands but will run only one thread upon activation. Each time the next thead will run.'),
})
  .merge(baseShortCutMappingSchema)
  .describe('An event schema that represent a set of commands that is executed when a certain shortkey is pressed');


const shortCutMappingSchema = z.union([shortcutMappingWithMacroSchema, randomShortCutMappingSchema, threadCircularShortCutMappingSchema]);

const combinationList = z.array(shortCutMappingSchema)
  .superRefine((combinations, ctx) => {
    const shortCuts = new Map<string, number>();
    combinations.forEach((value, i) => {
      if (shortCuts.has(value.shortCut)) {
        ctx.addIssue({
          code: ZodIssueCode.custom,
          path: ['shortcut', i],
          message: `Shortcut ${value.shortCut} already exists at index ${shortCuts.get(value.shortCut)}`,
        });
      }
      shortCuts.set(value.shortCut, i);
    });
  }).describe('Shorcuts mappings. Main logic');

type ShortsData = z.infer<typeof shortCutMappingSchema>;
type RandomShortcutMapping = z.infer<typeof randomShortCutMappingSchema>;
type MacroShortcutMapping = z.infer<typeof shortcutMappingWithMacroSchema>;
type MacroShortcutMappingCircular = z.infer<typeof threadCircularShortCutMappingSchema>;

export type {
  ShortsData,
  RandomShortcutMapping,
  MacroShortcutMapping,
  MacroShortcutMappingCircular,
};

export {
  randomShortCutMappingSchema,
  shortcutMappingWithMacroSchema,
  threadCircularShortCutMappingSchema,
  commandSchema,
  commandsAndMacrosArraySchema,
  commandsSchema,
  combinationList,
  commandOrMacroSchema,
};
