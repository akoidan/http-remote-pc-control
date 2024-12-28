import {z} from 'zod';
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
  keySend: z.union([keySchema, variableSchema])!.describe(`Available combination ${JSON.stringify(possibleKeys)}`),
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

const receiverSchema = z.union([
  receiverSchemaKey,
  receiverSchemaMouse,
  receiverSchemaLaunchExe,
  receiverSchemaTypeText,
]);


const receiverSchemaAndMacro = z.union([
  receiverSchema,
  receiverSchemaMacro,
]);

type ReceiveTypeText = z.infer<typeof receiverSchemaTypeText>
type ReceiveMacro = z.infer<typeof receiverSchemaMacro>
type ReceiverSimple = z.infer<typeof receiverSchemaKey>
type ReceiverBase = z.infer<typeof baseSchema>
type ReceiverMouse = z.infer<typeof receiverSchemaMouse>
type ReceiveExecute = z.infer<typeof receiverSchemaLaunchExe>
type Receiver = z.infer<typeof receiverSchema>
type KeySend = z.infer<typeof keySchema>;
type ReceiverAndMacro = z.infer<typeof receiverSchemaAndMacro>

export type {
  ReceiveTypeText,
  ReceiveMacro,
  ReceiverSimple,
  ReceiverBase,
  ReceiverMouse,
  ReceiveExecute,
  Receiver,
  KeySend,
  ReceiverAndMacro,
};
export {
  receiverSchema,
  receiverSchemaAndMacro,
};

