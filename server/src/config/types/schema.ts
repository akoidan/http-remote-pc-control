/* eslint-disable max-lines*/
import {
  z,
  ZodIssueCode,
} from 'zod';
import {
  type ReceiveMacro,
  commandOrMacroSchema,
  commandSchema,
  keyPressCommandSchema,
  launchExeCommandSchema,
  typeTextCommandSchema,
  runMacroCommandSchema,
  mouseClickCommandSchema,
  killExeCommandSchema,
  type Receiver,
} from '@/config/types/commands';


const ipsSchema = z.record(z.string().ip());

const aliasesSchema = z.record(z.union([z.array(z.string()), z.string()]))
  .describe('A map for extra layer above destination property. E.g. you can define PC name in ' +
    'IPS section and instead of specifying PC name directly you can use aliases from this section that points to the PC name.');


const receiversAndMacrosArray = z.array(commandOrMacroSchema)
  .describe('A set of events that executed sequentially in this thread');// Define the schema for the 'combinations'
// part
const shortCutMappingSchema = z.object({
  receivers: z.array(commandOrMacroSchema).optional().describe('List of commands for different receivers'),
  receiversMulti: z.array(receiversAndMacrosArray).optional()
    .describe('This option should be defined only if receivers attribute is absent.' +
      ' Same as receivers but array of arrays of commands. Top level of array executes in parallel'),
  shuffle: z.boolean().optional().describe('If circular set to true, commands in this event would be executed randomly by 1'),
  delay: z.number().optional().describe('Delay in milliseconds between commands for this shorcut'),
  name: z.string().describe('Name that is printed during startup with a shorcut'),
  shortCut: z.string().describe('A shorcut to be pressed. E.g. Alt+1'),
  circular: z.boolean().optional().describe('If set to true. Commands in this chain will be executed in a circular way.' +
    ' So each press = 1 command. Instead of full commands'),
}).refine(
  (data) =>
    (data.receivers && !data.receiversMulti) ?? (!data.receivers && data.receiversMulti),
  {
    message: 'Either receivers or receiversMulti must be present, but not both.',
    path: ['receivers', 'receiversMulti'], // Error will be shown for both fields
  }
).refine(
  (data) =>
    (!data.receivers || !(data.circular && data.receivers.length <= 1)),
  {
    message: 'circular=true can be applied when there are multiple receivers',
    path: ['receivers', 'circular'], // Error will be shown for both fields
  }
).describe('An event schema that represent a set of commands that is executed when a cirtain shortkey is pressed');


const macrosList = z.record(z.object({
  commands: z.array(commandSchema).describe('Set of commands for this macro'),
  variables: z.array(z.string()).optional()
    .describe('Variables that are used in macros. If you set a option value to {{varName}}' +
      ' in this macro section. If this varName is present in this array, it will be replaced'),
})).describe('A map of macro commands, where a key is a macro name. ');


// Define the full schema for the provided JSON structure
const rootSchema = z.object({
  ips: ipsSchema.describe('Remote PCS ips with their names that are used in destination property'),
  aliases: z.optional(aliasesSchema).describe('Aliases or remote PCs bindinds'),
  delay: z.number().describe('Global delay in miliseconds between commands in order to prevent spam. Could be set to 0'),
  combinations: z.array(shortCutMappingSchema).describe('Shorcuts mappings. Main logic'),
  macros: z.optional(macrosList).describe('List of macros in order to omit DRY'),
}).superRefine((data, ctx) => {
  // Ensure mapping values are arrays of keys from ips
  const ipsKeys = new Set(Object.keys(data.ips));
  Object.entries(data.aliases ?? {}).forEach(([key, value]) => {
    const values = value instanceof Array ? value : [value];
    if (ipsKeys.has(key)) {
      ctx.addIssue({
        code: ZodIssueCode.custom,
        path: ['aliases', key],
        message: `Alias ${key} should not be the same as a key from ips`,
      });
    }
    values.forEach((v) => {
      if (!ipsKeys.has(v)) {
        ctx.addIssue({
          code: ZodIssueCode.custom,
          path: ['aliases', key],
          message: `"${v}" is not a valid key from ips, valid are ${JSON.stringify(Array.from(ipsKeys))}`,
        });
      }
    });
  });
}).superRefine((data, ctx) => {
  const alisesKeys = new Set(Object.keys(data.aliases ?? {}));
  const ipsKeys = new Set(Object.keys(data.ips));
  data.combinations.forEach((value, combId) => {
    const allReceivers = value.receivers ?? value.receiversMulti!.flat();
    allReceivers.forEach((v, receiverId) => {
      if (!(v as ReceiveMacro).macro && !alisesKeys.has((v as Receiver).destination) && !data.ips[(v as Receiver).destination]) {
        const allOptions = JSON.stringify([...Array.from(alisesKeys), ...Array.from(ipsKeys)]);
        ctx.addIssue({
          code: ZodIssueCode.custom,
          path: [`combinations[${combId}]`, `receivers[${receiverId}]`, 'destination'],
          message: `"${(v as Receiver).destination}" is not a valid destination, possible options are ${allOptions}`,
        });
      }
      if ((v as ReceiveMacro).macro) {
        if (!data.macros?.[(v as ReceiveMacro).macro]) {
          ctx.addIssue({
            code: ZodIssueCode.custom,
            path: [`combinations[${combId}]`, `receivers[${receiverId}]`, 'destination'],
            message: `Macro ${(v as ReceiveMacro).macro} doesn't exist`,
          });
        } else if ((data.macros[(v as ReceiveMacro).macro]?.variables?.length ?? 0) > 0) {
          const macroVars = data.macros[(v as ReceiveMacro).macro].variables!.sort();
          const calledVars = Object.keys((v as ReceiveMacro).variables ?? {})!.sort();
          if (JSON.stringify(macroVars) !== JSON.stringify(calledVars)) {
            ctx.addIssue({
              code: ZodIssueCode.custom,
              path: [`combinations[${combId}]`, `receivers[${receiverId}]`, 'variables'],
              message: `Macro ${(v as ReceiveMacro).macro} variables missmatch ${JSON.stringify(macroVars)} ${JSON.stringify(calledVars)}`,
            });
          }
        }
      }
    });
  });
}).superRefine((data, ctx) => {
  const shortCuts = new Map<string, number>();
  data.combinations.forEach((value, i) => {
    if (shortCuts.has(value.shortCut)) {
      ctx.addIssue({
        code: ZodIssueCode.custom,
        path: ['combinations', 'shortcut', i],
        message: `Shortcut ${value.shortCut} already exists at index ${shortCuts.get(value.shortCut)}`,
      });
    }
    shortCuts.set(value.shortCut, i);
  });
});

// Generate TypeScript type
type ConfigData = z.infer<typeof rootSchema>;
type EventData = z.infer<typeof shortCutMappingSchema>
type Ips = z.infer<typeof ipsSchema>
type Aliases = z.infer<typeof aliasesSchema>
type MacroList = z.infer<typeof macrosList>

export type {
  ConfigData,
  EventData,
  Ips,
  Aliases,
  MacroList,
};

export {
  rootSchema,
  ipsSchema,
  shortCutMappingSchema,
  aliasesSchema,
  macrosList,
  commandSchema,
  keyPressCommandSchema,
  receiversAndMacrosArray,
  launchExeCommandSchema,
  typeTextCommandSchema,
  runMacroCommandSchema,
  mouseClickCommandSchema,
  killExeCommandSchema,
  commandOrMacroSchema,
};

