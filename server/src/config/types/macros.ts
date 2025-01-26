import {
  z,
  ZodIssueCode,
} from 'zod';
import {
  commandSchema,
} from '@/config/types/schema';
import {schemaRootCache} from '@/config/types/cache';
import {delaySchema} from '@/config/types/commands';
import {variableRegex} from '@/config/types/variables';

const runMacroCommandSchema = z.object({
  macro: z.string().describe('Name of the macro (key from macros section object)'),
  variables: z.record(z.union([z.string(), z.number()])).optional().describe('Object of a key-values of variable name and value'),
})
  .strict()
  .merge(delaySchema)
  .superRefine((command, ctx) => {
    const definedMacros: NonNullable<MacroList> = {...(schemaRootCache.data?.macros ?? {}), ...(schemaRootCache?.macros ?? {})};
    if (!definedMacros[command.macro]) {
      ctx.addIssue({
        code: ZodIssueCode.custom,
        path: ['macro'],
        message: `Macro ${command.macro} doesn't exist. Available macros are ${Object.keys(definedMacros).join(', ')}`,
      });
    }
  }).superRefine((command, ctx) => {
    const definedMacros: NonNullable<MacroList> = {...(schemaRootCache.data?.macros ?? {}), ...(schemaRootCache?.macros ?? {})};
    if (!definedMacros[command.macro] || !command.variables) {
      return;
    }
    for (const [key, value] of Object.entries(command.variables!)) {
      if (!definedMacros[command.macro]?.variables?.[key]) {
        ctx.addIssue({
          code: ZodIssueCode.custom,
          path: ['variables'],
          message: `Passed variable ${key}=${value} doesn't have a description on macro`,
        });
      }
    }
  }).superRefine((command, ctx) => {
    const definedMacros: NonNullable<MacroList> = {...(schemaRootCache.data?.macros ?? {}), ...(schemaRootCache?.macros ?? {})};
    if (!definedMacros[command.macro] || !command.variables) {
      return;
    }
    for (const [key, value] of Object.entries(definedMacros[command.macro]?.variables)) {
      let isVariable = false;
      if (typeof command.variables?.[key] === 'string' && variableRegex.test(command.variables?.[key])) {
        isVariable = true;
      }
      if (command.variables?.[key] && value!.type !== typeof command.variables?.[key] && !isVariable) {
        ctx.addIssue({
          code: ZodIssueCode.custom,
          path: ['variables'],
          message: `Passed variable ${key}=${command.variables?.[key]} type of ${typeof command.variables?.[key]}, expected ${value!.type}`,
        });
      }
      if (!value!.optional && !command.variables?.[key]) {
        ctx.addIssue({
          code: ZodIssueCode.custom,
          path: ['variables'],
          message: `macro ${command.macro} requires variable ${key} but only ${JSON.stringify(command.variables)} were passed`,
        });
      }
    }
  }).describe('Runs a macro from the macros section.');

const commandOrMacroSchema = z.union([
  commandSchema,
  runMacroCommandSchema,
])
  .describe('A remote command or a macro name');

const macroVariablesDescriptionSchema = z.record(z.object({
  type: z.enum(['string', 'number']).describe('To validate the type, or cast from env variables'),
  optional: z.boolean().optional().describe('If set to true, the key is be removed is var is not passed'),
})
  .strict()
  .optional())
  .describe('Set of variables descriptors for macro');

const macroSchema = z.object({
  commands: z.array(commandOrMacroSchema).describe('Set of commands for this macro'),
  variables: macroVariablesDescriptionSchema,
})
  .strict()
  .describe('A macro that can be injected instead of command. That will run commands from its body. Can be also injected with variables.' +
    ' Think of it like a function');

const macrosDefinitionSchema = z.record(macroSchema)
  .optional()
  .describe('A map of macros where a key is the macro name and value is its body');


type MacroCommand = z.infer<typeof runMacroCommandSchema>
type CommandOrMacro = z.infer<typeof commandOrMacroSchema>
type MacroList = z.infer<typeof macrosDefinitionSchema>
type VariablesDefinition = z.infer<typeof macroVariablesDescriptionSchema>

export {
  runMacroCommandSchema,
  commandOrMacroSchema,
  macroVariablesDescriptionSchema,
  macroSchema,
  macrosDefinitionSchema,
};

export type {
  MacroCommand,
  VariablesDefinition,
  CommandOrMacro,
  MacroList,
};
