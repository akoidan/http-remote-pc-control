import {Key} from '@nut-tree-fork/nut-js';
// @ts-expect-error
import KeyboardAction from '@nut-tree-fork/libnut/dist/lib/libnut-keyboard.class.js';
import {
  IsIn,
  IsString,
} from 'class-validator';


const possibleKeys: string[] = [...KeyboardAction.KeyLookupMap.values()];
const invertedMap = new Map<string, Key>([...KeyboardAction.KeyLookupMap].map(([key, value]) => [value, key]));


class KeyPressRequest {
  @IsIn(possibleKeys)
  @IsString()
  key: string;
}

class TypeTextRequest {
  @IsString()
  text: string;
}

export {possibleKeys, invertedMap, KeyPressRequest, TypeTextRequest};
