import {
  z,
  ZodIssueCode
} from 'zod';
import { Key } from '@nut-tree-fork/nut-js';
// @ts-expect-error
import KeyboardAction from "@nut-tree-fork/libnut/dist/lib/libnut-keyboard.class.js";


export const possibleKeys: string[] = [...KeyboardAction.KeyLookupMap.values()]

const ipsSchema = z.record(z.string().ip());

const aliasesSchema = z.record(z.union([z.array(z.string()), z.string()]));

const keySchema = z.enum(possibleKeys as any);

const destinationSchema = z.object({
  destination: z.string(),
})

const delaySchema = z.object({
  delay: z.number().optional(),
})

const receiverSchemaKey = z.object({
  keySend: keySchema,
});


const receiverSchemaLaunchExe = z.object({
  launch: z.string(),
});


const receiverSchemaMacro = z.object({
  macro: z.string(),
});

const receiverSchemaTypeText = z.object({
  typeText: z.string(),
});

const receiverSchemaMouse = z.object({
  mouseMoveX: z.number(),
  mouseMoveY: z.number(),
});

const receiverSchema = z.union([
  receiverSchemaKey.merge(destinationSchema).merge(delaySchema),
  receiverSchemaMouse.merge(destinationSchema).merge(delaySchema),
  receiverSchemaLaunchExe.merge(destinationSchema).merge(delaySchema),
  receiverSchemaTypeText.merge(destinationSchema).merge(delaySchema),
  receiverSchemaMacro.merge(destinationSchema).merge(delaySchema),
]);

const macroCommands = z.union([
  receiverSchemaKey.merge(delaySchema),
  receiverSchemaMouse.merge(delaySchema),
  receiverSchemaLaunchExe.merge(delaySchema),
  receiverSchemaTypeText.merge(delaySchema),
]);

// Define the schema for the 'combinations' part
const eventSchema = z.object({
  receivers: z.array(receiverSchema).optional(),
  receiversMulti: z.array(z.array(receiverSchema)).optional(),
  shuffle: z.boolean().optional(),
  delay: z.number().optional(),
  name: z.string(),
  shortCut: z.string(),
  circular: z.boolean().optional(),
}).refine(
  (data) =>
    (data.receivers && !data.receiversMulti) || (!data.receivers && data.receiversMulti),
  {
    message: 'Either receivers or receiversMulti must be present, but not both.',
    path: ['receivers', 'receiversMulti'], // Error will be shown for both fields
  }
).refine(
  (data) =>
    (!(data.circular && data.receivers.length <= 1)),
  {
    message: 'circular=true can be applied when there are multiple receivers',
    path: ['receivers', 'circular'], // Error will be shown for both fields
  }
)

const macrosList = z.record(z.array(macroCommands));

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
        path: ["aliases", key],
        message: `Alias ${key} should not be the same as a key from ips`,
      });
    }
    values.forEach((v) => {
      if (!ipsKeys.has(v)) {
        ctx.addIssue({
          code: ZodIssueCode.custom,
          path: ["aliases", key],
          message: `"${v}" is not a valid key from ips, valid are ${JSON.stringify(Array.from(ipsKeys))}`,
        });
      }
    });
  });
  data.combinations.forEach((value, combId) => {
    const allReceivers = value.receivers ?? value.receiversMulti.flat();
    allReceivers.forEach((v) => {
      if (!alisesKeys.has(v.destination) && !data.ips[v.destination]) {
        ctx.addIssue({
          code: ZodIssueCode.custom,
          path: ["combinations", "receivers", combId, "destination"],
          message: `"${v.destination}" is not a valid destination, possible options are ${JSON.stringify([...Array.from(alisesKeys), ...Array.from(ipsKeys)])}`,
        });
      }
      if ((v as ReceiveMacro).macro && !data.macros?.[(v as ReceiveMacro).macro]) {
        ctx.addIssue({
          code: ZodIssueCode.custom,
          path: ["combinations", "receivers", combId, "destination"],
          message: `Macro ${(v as ReceiveMacro).macro} doesn't exist`,
        });
      }
    });
  });
  const shortCuts = new Map<string, number>();
  data.combinations.forEach((value, i) => {
    if (shortCuts.has(value.shortCut)) {
      ctx.addIssue({
        code: ZodIssueCode.custom,
        path: ["combinations", "shortcut", i],
        message: `Shortcut ${value.shortCut} already exists at index ${shortCuts.get(value.shortCut)}`,
      });
    }
    shortCuts.set(value.shortCut, i);
  });
});

// Generate TypeScript type
export type ConfigData = z.infer<typeof fullSchema>;
export type KeySend = z.infer<typeof keySchema>;
export type EventData = z.infer<typeof eventSchema>
export type Ips = z.infer<typeof ipsSchema>
export type Aliases = z.infer<typeof aliasesSchema>
export type ReceiverSimple = z.infer<typeof receiverSchemaKey>
export type ReceiverMouse = z.infer<typeof receiverSchemaMouse>
export type ReceiveExecute = z.infer<typeof receiverSchemaLaunchExe>
export type ReceiveTypeText = z.infer<typeof receiverSchemaTypeText>
export type ReceiveMacro = z.infer<typeof receiverSchemaMacro>
export type MacroList = z.infer<typeof macrosList>
export type Receiver = z.infer<typeof receiverSchema>
