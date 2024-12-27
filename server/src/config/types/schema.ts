/* eslint-disable import/group-exports */

import {
  z,
  ZodIssueCode,
} from 'zod';
import {
  type ReceiveMacro,
  receiverSchemaAndMacro,
  receiverSchema,
  type Receiver,
} from '@/config/types/commands';


const ipsSchema = z.record(z.string().ip());

const aliasesSchema = z.record(z.union([z.array(z.string()), z.string()]));


// Define the schema for the 'combinations' part
const eventSchema = z.object({
  receivers: z.array(receiverSchemaAndMacro).optional(),
  receiversMulti: z.array(z.array(receiverSchemaAndMacro)).optional(),
  shuffle: z.boolean().optional(),
  delay: z.number().optional(),
  name: z.string(),
  shortCut: z.string(),
  circular: z.boolean().optional(),
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
);

const macrosList = z.record(z.object({
  commands: z.array(receiverSchema),
  variables: z.array(z.string()).optional(),
}));

// Define the full schema for the provided JSON structure
export const fullSchema = z.object({
  ips: ipsSchema,
  aliases: z.optional(aliasesSchema),
  delay: z.number(),
  combinations: z.array(eventSchema),
  macros: z.optional(macrosList),
}).superRefine((data, ctx) => {
  // Ensure mapping values are arrays of keys from ips
  const ipsKeys = new Set(Object.keys(data.ips));
  const alisesKeys = new Set(Object.keys(data.aliases ?? {}));
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
        } else if (data.macros[(v as ReceiveMacro).macro]?.variables?.length ?? 0 > 0) {
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
export type ConfigData = z.infer<typeof fullSchema>;
export type EventData = z.infer<typeof eventSchema>
export type Ips = z.infer<typeof ipsSchema>
export type Aliases = z.infer<typeof aliasesSchema>
export type MacroList = z.infer<typeof macrosList>

