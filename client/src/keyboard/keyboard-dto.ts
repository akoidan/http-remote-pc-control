import {Key} from '@nut-tree-fork/nut-js';
// @ts-expect-error
import KeyboardAction from '@nut-tree-fork/libnut/dist/lib/libnut-keyboard.class.js';
import {IsIn, IsString} from 'class-validator';


export const possibleKeys: string[] = [...KeyboardAction.KeyLookupMap.values()];
export const invertedMap = new Map<string, Key>([...KeyboardAction.KeyLookupMap].map(([key, value]) => [value, key]));


export class KeyPressRequest {
  @IsIn(possibleKeys)
  @IsString()
  key: string;
}

export class TypeTextRequest {
  @IsString()
  text: string;
}