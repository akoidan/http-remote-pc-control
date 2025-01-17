import type {Key} from '@nut-tree-fork/nut-js';
// @ts-expect-error
import KeyboardAction from '@nut-tree-fork/libnut/dist/lib/libnut-keyboard.class.js';
import {z} from 'zod';


const possibleKeys: string[] = [...KeyboardAction.KeyLookupMap.values()];
const invertedMap = new Map<string, Key>([...KeyboardAction.KeyLookupMap].map(([key, value]) => [value, key]));

const keySchema = z.enum(possibleKeys as any).describe('A key to be sent.');

const keyPressRequestSchema = z.object({
  keys: z.array(keySchema),
  holdKeys: z.array(keySchema).optional(),
}).superRefine((data: any, ctx) => {
  if (data.key && data.multiKey) {
    return ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'key and multiKey cannot be used together',
    });
  }
  return true;
});

type KeyPressRequest = z.infer<typeof keyPressRequestSchema>
const typeTextRequestSchema = z.object({
  text: z.string(),
});

type TypeTextRequest = z.infer<typeof typeTextRequestSchema>;

export type {KeyPressRequest, TypeTextRequest};
export {possibleKeys, invertedMap, keyPressRequestSchema, typeTextRequestSchema};
