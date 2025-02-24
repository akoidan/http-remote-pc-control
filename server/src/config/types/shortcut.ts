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

// eslint-disable-next-line max-len
const allowedKeys = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7', 'f8', 'f9', 'f10', 'f11', 'f12', 'f13', 'f14', 'f15', 'f16', 'f17', 'f18', 'f19', 'f20', 'f21', 'f22', 'f23', 'f24', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'numpad_0', 'numpad_1', 'numpad_2', 'numpad_3', 'numpad_4', 'numpad_5', 'numpad_6', 'numpad_7', 'numpad_8', 'numpad_9', 'numpad_decimal', 'space', 'escape', 'tab', 'alt', 'control', 'right_alt', 'right_control', 'win', 'right_win', 'cmd', 'right_cmd', 'menu', 'fn', 'shift', 'command', 'right_shift', '`', '-', '=', 'backspace', '[', ']', '\\', ';', '\'', 'enter', ',', '.', '/', 'left', 'up', 'right', 'down', 'printscreen', 'insert', 'delete', 'home', 'end', 'pageup', 'pagedown', 'add', 'subtract', 'multiply', 'divide', 'caps_lock', 'scroll_lock', 'num_lock', 'audio_mute', 'audio_vol_down', 'audio_vol_up', 'audio_play', 'audio_stop', 'audio_pause', 'audio_prev', 'audio_next', 'audio_rewind', 'audio_forward', 'audio_repeat', 'audio_random'];// Define allowed modifier keys
const modifierKeys = ['control', 'ctrl', 'alt', 'shift', 'meta', 'command', 'win', 'cmd', 'super', 'left_alt', 'right_alt'];

// Zod schema for shortcuts
const shortCut = z
  .string()
  .refine((value) => {
    const modifiers = value.toLowerCase().split('+');
    // Must have at least 2 parts: one modifier and one main key
    if (modifiers.length < 2 || modifiers.length > 4) {
      return false;
    }
    const mainKey = modifiers.pop();
    // Ensure modifiers are unique and valid
    if (new Set(modifiers).size !== modifiers.length) {
      return false;
    }
    if (!modifiers.every((mod) => modifierKeys.includes(mod))) {
      return false;
    }
    return allowedKeys.includes(mainKey!);
    // eslint-disable-next-line max-len
    }, `Shortcut requires format Modifier+Key. E.g. 'Alt+1'. Allowed modifiers: '${modifierKeys.join('\', \'')}'. Allowed keys: '${allowedKeys.join('\', \'')}'.`)
  .describe('A shorcut to be pressed. E.g. Alt+1');


const baseShortCutMappingSchema = z.object({
  delayAfter: z.number().optional().describe('Delay in milliseconds after each command for this shorcut'),
  delayBefore: z.number().optional().describe('Delay in milliseconds before each command for this shorcut'),
  name: z.string().describe('Name that is printed during startup with a shorcut'),
  shortCut,
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
  shortCut,
  commandSchema,
  commandsAndMacrosArraySchema,
  commandsSchema,
  combinationList,
  commandOrMacroSchema,
};
