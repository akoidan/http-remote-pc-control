import { z } from 'zod';
// @ts-expect-error
import KeyboardAction from '@nut-tree-fork/libnut/dist/lib/libnut-keyboard.class.js';

// eslint-disable-next-line
const possibleKeys: string[] = [...KeyboardAction.KeyLookupMap.values()] as string[];

const variableSchema = z.string().regex(/\{\{\w+\}\}/u);
const keySchema = z.enum(possibleKeys as any);

const delaySchema = z.object({
  delay: z.union([z.number(), variableSchema]).optional(),
});

const baseSchema = z.object({
  destination: z.string(),
}).merge(delaySchema);


const receiverSchemaKey = z.object({
  keySend: z.union([keySchema, variableSchema]),
}).merge(baseSchema);


const receiverSchemaLaunchExe = z.object({
  launch: z.string(),
}).merge(baseSchema);


const receiverSchemaMacro = z.object({
  macro: z.string(),
  variables: z.record(z.any()).optional(),
}).merge(delaySchema);

const receiverSchemaTypeText = z.object({
  typeText: z.string(),
}).merge(baseSchema);

const receiverSchemaMouse = z.object({
  mouseMoveX: z.number(),
  mouseMoveY: z.number(),
}).merge(baseSchema);

export const receiverSchema = z.union([
  receiverSchemaKey,
  receiverSchemaMouse,
  receiverSchemaLaunchExe,
  receiverSchemaTypeText,
]);


export const receiverSchemaAndMacro = z.union([
  receiverSchema,
  receiverSchemaMacro,
]);

export type ReceiveTypeText = z.infer<typeof receiverSchemaTypeText>
export type ReceiveMacro = z.infer<typeof receiverSchemaMacro>
export type ReceiverSimple = z.infer<typeof receiverSchemaKey>
export type ReceiverBase = z.infer<typeof baseSchema>
export type ReceiverMouse = z.infer<typeof receiverSchemaMouse>
export type ReceiveExecute = z.infer<typeof receiverSchemaLaunchExe>
export type Receiver = z.infer<typeof receiverSchema>
export type KeySend = z.infer<typeof keySchema>;
export type ReceiverAndMacro = z.infer<typeof receiverSchemaAndMacro>
