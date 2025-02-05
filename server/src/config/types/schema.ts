/* eslint-disable max-lines*/
import {
  z,
  ZodIssueCode,
} from 'zod';

import {
  commandSchema,
  focusWindowCommandSchema,
  keyPressCommandSchema,
  keySchema,
  killExeByNameCommandSchema,
  killExeByPidCommandSchema,
  launchExeCommandSchema,
  mouseClickCommandSchema,
  typeTextCommandSchema,
} from '@/config/types/commands';
import {
  variablesSchema,
  variableValueSchema,
} from '@/config/types/variables';
import {
  commandOrMacroSchema,
  runMacroCommandSchema,
  macroSchema,
  macrosDefinitionSchema,
  macroVariablesDescriptionSchema,
} from '@/config/types/macros';
import {
  randomShortCutMappingSchema,
  shortcutMappingWithMacroSchema,
  commandsAndMacrosArraySchema,
  commandsSchema,
  combinationList,
  threadCircularShortCutMappingSchema,
  shortCut,
} from '@/config/types/shortcut';

const ipsSchema = z.record(z.string().ip())
  .describe('Definition of remote PCs where keys are PC names and values are their IP addresses.' +
    ' The IP address should be available to a remote PC.' +
    ' You can also use https://ngrok.com/ to get public address or create VPN ');

const aliasesSchema = z.record(z.union([z.array(z.string()), z.string()]))
  .optional()
  .describe('A map for extra layer above destination property. E.g. you can define PC name in ' +
    'IPS section and instead of specifying PC name directly you can use aliases from this section that points to the PC name.');


const aARootSchema = z.object({
  ips: ipsSchema,
  aliases: aliasesSchema,
  delay: z.number().describe('Global delay in miliseconds between commands in order to prevent spam. Could be set to 0'),
  combinations: combinationList,
  macros: macrosDefinitionSchema,
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
});

// Generate TypeScript type
type ConfigData = z.infer<typeof aARootSchema>;

type IpsData = z.infer<typeof ipsSchema>
type AliasesData = z.infer<typeof aliasesSchema>


export type {
  ConfigData,
  IpsData,
  AliasesData,
};

export {
  aARootSchema,
  keySchema,
  shortCut,
  macroSchema,
  macrosDefinitionSchema,
  macroVariablesDescriptionSchema,
  randomShortCutMappingSchema,
  threadCircularShortCutMappingSchema,
  shortcutMappingWithMacroSchema,
  commandSchema,
  ipsSchema,
  aliasesSchema,
  variableValueSchema,
  keyPressCommandSchema,
  commandsAndMacrosArraySchema,
  launchExeCommandSchema,
  typeTextCommandSchema,
  focusWindowCommandSchema,
  commandsSchema,
  runMacroCommandSchema,
  combinationList,
  mouseClickCommandSchema,
  variablesSchema,
  killExeByNameCommandSchema,
  killExeByPidCommandSchema,
  commandOrMacroSchema,
};

