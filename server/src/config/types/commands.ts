import {
  z,
  ZodIssueCode,
} from 'zod';
import {schemaRootCache} from '@/config/types/cache';
import type {ConfigData} from '@/config/types/schema';
import {
  variableRegex,
  variableValueSchema,
} from '@/config/types/variables';

// import KeyboardAction from '@nut-tree-fork/libnut/dist/lib/libnut-keyboard.class.js';
// const possibleKeys: string[] = [...KeyboardAction.KeyLookupMap.values()] as string[];
// eslint-disable-next-line  max-len
const keySchema = z.enum(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7', 'f8', 'f9', 'f10', 'f11', 'f12', 'f13', 'f14', 'f15', 'f16', 'f17', 'f18', 'f19', 'f20', 'f21', 'f22', 'f23', 'f24', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'numpad_0', 'numpad_1', 'numpad_2', 'numpad_3', 'numpad_4', 'numpad_5', 'numpad_6', 'numpad_7', 'numpad_8', 'numpad_9', 'numpad_decimal', 'space', 'escape', 'tab', 'alt', 'control', 'right_alt', 'right_control', 'win', 'right_win', 'cmd', 'right_cmd', 'menu', 'fn', 'shift', 'command', 'right_shift', 'command', '`', '-', '=', 'backspace', '[', ']', '\\', ';', '\'', 'enter', ',', '.', '/', 'left', 'up', 'right', 'down', 'printscreen', 'insert', 'delete', 'home', 'end', 'pageup', 'pagedown', 'add', 'subtract', 'multiply', 'divide', 'enter', 'caps_lock', 'scroll_lock', 'num_lock', 'audio_mute', 'audio_vol_down', 'audio_vol_up', 'audio_play', 'audio_stop', 'audio_pause', 'audio_prev', 'audio_next', 'audio_rewind', 'audio_forward', 'audio_repeat', 'audio_random']).describe('A key to be sent.');

const delaySchema = z.object({
  delayAfter: z.union([z.number(), variableValueSchema]).optional()
    .describe('Delay in milliseconds before the next command. So this command can finish execution'),
  delayBefore: z.union([z.number(), variableValueSchema]).optional()
    .describe('Delay in milliseconds before the next command. So this command can finish execution'),
}).strict();

const baseSchema = z.object({
  destination: z.union([z.string().superRefine((destination, ctx) => {
    const data: ConfigData = schemaRootCache.data ?? {};
    const alisesKeys = new Set(Object.keys(data.aliases ?? {}));
    const ipsKeys = new Set(Object.keys(data.ips));

    if (!alisesKeys.has(destination) && !data.ips[destination] && !variableRegex.test(destination)) {
      const allOptions = JSON.stringify([...Array.from(alisesKeys), ...Array.from(ipsKeys)]);
      ctx.addIssue({
        code: ZodIssueCode.custom,
        path: ['destination'],
        message: `"${destination}" is not a valid destination, possible options are ${allOptions}`,
      });
    }
  }), variableValueSchema]).describe('Remote PC from ips or aliases section to send this command to'),
}).strict().merge(delaySchema);


const keyPressCommandSchema = z.object({
  keySend: z.union([keySchema, variableValueSchema, z.array(keySchema)])
    .describe('Key that will be pressed'),
  holdKeys: z.union([keySchema, variableValueSchema, z.array(keySchema)])
    .optional()
    .describe('Keys that will be hold during pressing main key. E.g if you need to send Alt+1, here goes Alt'),
}).strict().merge(baseSchema).describe('Sends a key press event (like you pressed on a keyboard) to a remote PC.');

const launchExeCommandSchema = z.object({
  launch: z.string().describe('Full path to an executable.'),
  arguments: z.array(z.string()).optional().describe('Array of arguments to an executable'),
  waitTillFinish: z.boolean().optional().describe('Waits until executable finishes to run before running the next command'),
  assignId: z.string().optional().describe('Assigns PID of launched command to a variable that can be used after'),
}).strict().merge(baseSchema).describe('Starts a program on a remote PC.');

const focusWindowCommandSchema = z.object({
  focusPid: z.union([variableValueSchema, z.number()]).describe('Pid of the process that has this window'),
}).strict().merge(baseSchema).describe('Focuses window with the provided PID, making it active');

const typeTextCommandSchema = z.object({
  typeText: z.union([z.string(), variableValueSchema]).describe('Any string to type'),
}).strict().merge(baseSchema).describe('Types text on the remote PC.');

const mouseMoveClickCommandSchema = z.object({
  mouseMoveX: z.union([z.number(), variableValueSchema]).describe('X coordinate'),
  mouseMoveY: z.union([z.number(), variableValueSchema]).describe('Y coordinate'),
}).strict().merge(baseSchema).describe('Moves mouse to specified coordinates and clicks with left button');

const leftMouseClickCommandSchema = z.object({
  leftMouseClick: z.boolean(),
}).strict().merge(baseSchema).describe('Clicks mouse on current position');

const killExeByNameCommandSchema = z.object({
  killByName: z.union([z.string(), variableValueSchema]).describe('Executable file name. E.g. Chrome.exe'),
}).strict().merge(baseSchema).describe('Kills a process on the remote PC.');

const killExeByPidCommandSchema = z.object({
  killByPid: z.union([z.number(), variableValueSchema]).describe('Executalbe process ID. E.g. 1234'),
}).strict().merge(baseSchema).describe('Kills a process on the remote PC.');

const commandSchema = z.union([
  keyPressCommandSchema,
  leftMouseClickCommandSchema,
  mouseMoveClickCommandSchema,
  launchExeCommandSchema,
  focusWindowCommandSchema,
  typeTextCommandSchema,
  killExeByPidCommandSchema,
  killExeByNameCommandSchema,
]).describe('A remote command');


type TypeTextCommand = z.infer<typeof typeTextCommandSchema>
type FocusWindowCommand = z.infer<typeof focusWindowCommandSchema>
type KeyPressCommand = z.infer<typeof keyPressCommandSchema>
type BaseCommand = z.infer<typeof baseSchema>
type MouseMoveClickCommand = z.infer<typeof mouseMoveClickCommandSchema>
type LeftMouseClickCommand = z.infer<typeof leftMouseClickCommandSchema>
type ExecuteCommand = z.infer<typeof launchExeCommandSchema>
type Command = z.infer<typeof commandSchema>
type Key = z.infer<typeof keySchema>;

type KillExeByPidCommand = z.infer<typeof killExeByPidCommandSchema>
type KillExeByNameCommand = z.infer<typeof killExeByNameCommandSchema>

export type {
  TypeTextCommand,
  KeyPressCommand,
  BaseCommand,
  MouseMoveClickCommand,
  LeftMouseClickCommand,
  FocusWindowCommand,
  ExecuteCommand,
  Command,
  Key,
  KillExeByPidCommand,
  KillExeByNameCommand,
};

export {
  keySchema,
  variableValueSchema,
  delaySchema,
  keyPressCommandSchema,
  launchExeCommandSchema,
  focusWindowCommandSchema,
  typeTextCommandSchema,
  mouseMoveClickCommandSchema,
  leftMouseClickCommandSchema,
  killExeByNameCommandSchema,
  killExeByPidCommandSchema,
  commandSchema,
};

