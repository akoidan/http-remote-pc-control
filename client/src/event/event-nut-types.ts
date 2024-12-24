import { Key } from '@nut-tree-fork/nut-js';
// @ts-expect-error
import KeyboardAction from "@nut-tree-fork/libnut/dist/lib/libnut-keyboard.class.js";


export const possibleKeys: string[] = [...KeyboardAction.KeyLookupMap.values()]
export const invertedMap: Map<string, Key> = new Map([...KeyboardAction.KeyLookupMap].map(([key, value]) => [value, key]));


