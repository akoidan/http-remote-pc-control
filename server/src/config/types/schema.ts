/* eslint-disable max-lines*/
import {
  z,
  ZodIssueCode,
} from 'zod';
import {
  type MacroCommand,
  keySchema,
  commandOrMacroSchema,
  commandSchema,
  keyPressCommandSchema,
  launchExeCommandSchema,
  typeTextCommandSchema,
  runMacroCommandSchema,
  mouseClickCommandSchema,
  variableSchema,
  killExeCommandSchema,
  type Command,
  focusWindowCommandSchema,
} from '@/config/types/commands';


const ipsSchema = z.record(z.string().ip())
  .describe('Definition of remote PCs where keys are PC names and values are their IP addresses.' +
    ' The IP address should be available to a remote PC.' +
    ' You can also use https://ngrok.com/ to get public address or create VPN ');

const aliasesSchema = z.record(z.union([z.array(z.string()), z.string()]))
  .optional()
  .describe('A map for extra layer above destination property. E.g. you can define PC name in ' +
    'IPS section and instead of specifying PC name directly you can use aliases from this section that points to the PC name.');


const receiversAndMacrosArray = z.array(commandOrMacroSchema)
  .describe('A set of events that executed sequentially in this thread');// Define the schema for the 'combinations'
// part
const shortCutMappingSchema = z.object({
  commands: z.array(commandOrMacroSchema).optional().describe('List of commands for different commands'),
  threads: z.array(receiversAndMacrosArray).optional()
    .describe('This option should be defined only if commands attribute is absent.' +
      ' Same as commands but array of arrays of commands. Top level of array executes in parallel'),
  shuffle: z.boolean().optional().describe('If circular set to true, commands in this event would be executed randomly by 1'),
  delay: z.number().optional().describe('Delay in milliseconds between commands for this shorcut'),
  name: z.string().describe('Name that is printed during startup with a shorcut'),
  shortCut: z.string().describe('A shorcut to be pressed. E.g. Alt+1'),
  circular: z.boolean().optional().describe('If set to true. Commands in this chain will be executed in a circular way.' +
    ' So each press = 1 command. Instead of full commands'),
})
  .strict()
  .refine(
    (data) =>
      (data.commands && !data.threads) ?? (!data.commands && data.threads),
    {
      message: 'Either commands or threads must be present, but not both.',
      path: ['commands', 'threads'], // Error will be shown for both fields
    }
  ).describe('An event schema that represent a set of commands that is executed when a cirtain shortkey is pressed');

const macroSchema = z.object({
  commands: z.array(commandSchema).describe('Set of commands for this macro'),
  variables: z.array(z.string()).optional()
    .describe('Variables that are used in macros. If you set a option value to {{varName}}' +
      ' in this macro section. If this varName is present in this array, it will be replaced'),
}).strict().describe('A macro that can be injected instead of command. ' +
  'That will run commands from its body. Can be also injected with variables. Think of it like a function');


const variableDescriptionSchema = z.object({
  type: z.enum(['string', 'number']).describe('if number, parseInt will be used'),
  defaultValue: z.any().describe('default value if not others are provided'),
}).describe('A variable that can be injected instead of command');

const variablesSchema = z.record(variableDescriptionSchema).optional().describe('Set of variable desciption along with default values');

const macrosMapSchema = z.record(macroSchema).optional().describe('A map of macros where a key is the macro name and value is its body');
// Define the full schema for the provided JSON structure
const aARootSchema = z.object({
  ips: ipsSchema,
  aliases: aliasesSchema,
  variables: variablesSchema,
  delay: z.number().describe('Global delay in miliseconds between commands in order to prevent spam. Could be set to 0'),
  combinations: z.array(shortCutMappingSchema).describe('Shorcuts mappings. Main logic'),
  macros: macrosMapSchema,
}).strict().superRefine((data, ctx) => {
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
    const allReceivers = value.commands ?? value.threads!.flat();
    allReceivers.forEach((v, receiverId) => {
      if (!(v as MacroCommand).macro && !alisesKeys.has((v as Command).destination) && !data.ips[(v as Command).destination]) {
        const allOptions = JSON.stringify([...Array.from(alisesKeys), ...Array.from(ipsKeys)]);
        ctx.addIssue({
          code: ZodIssueCode.custom,
          path: [`combinations[${combId}]`, `commands[${receiverId}]`, 'destination'],
          message: `"${(v as Command).destination}" is not a valid destination, possible options are ${allOptions}`,
        });
      }
      if ((v as MacroCommand).macro) {
        if (!data.macros?.[(v as MacroCommand).macro]) {
          ctx.addIssue({
            code: ZodIssueCode.custom,
            path: [`combinations[${combId}]`, `commands[${receiverId}]`, 'destination'],
            message: `Macro ${(v as MacroCommand).macro} doesn't exist`,
          });
        } else if ((data.macros[(v as MacroCommand).macro]?.variables?.length ?? 0) > 0) {
          const macroVars = data.macros[(v as MacroCommand).macro].variables!.sort();
          const calledVars = Object.keys((v as MacroCommand).variables ?? {})!.sort();
          if (JSON.stringify(macroVars) !== JSON.stringify(calledVars)) {
            ctx.addIssue({
              code: ZodIssueCode.custom,
              path: [`combinations[${combId}]`, `commands[${receiverId}]`, 'variables'],
              message: `Macro ${(v as MacroCommand).macro} variables missmatch ${JSON.stringify(macroVars)} ${JSON.stringify(calledVars)}`,
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
type ConfigData = z.infer<typeof aARootSchema>;
type EventData = z.infer<typeof shortCutMappingSchema>
type Ips = z.infer<typeof ipsSchema>
type Aliases = z.infer<typeof aliasesSchema>
type Variables = z.infer<typeof variablesSchema>
type VariablesDescription = z.infer<typeof variableDescriptionSchema>
type MacroList = z.infer<typeof macrosMapSchema>

export type {
  ConfigData,
  EventData,
  Ips,
  Variables,
  VariablesDescription,
  Aliases,
  MacroList,
};

export {
  aARootSchema,
  keySchema,
  variableDescriptionSchema,
  variablesSchema,
  macrosMapSchema,
  shortCutMappingSchema,
  macroSchema,
  commandSchema,
  keyPressCommandSchema,
  receiversAndMacrosArray,
  launchExeCommandSchema,
  typeTextCommandSchema,
  focusWindowCommandSchema,
  runMacroCommandSchema,
  mouseClickCommandSchema,
  killExeCommandSchema,
  commandOrMacroSchema,
};

