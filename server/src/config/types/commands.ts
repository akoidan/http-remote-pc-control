import {z} from 'zod';

const variableSchema = z.string().regex(/\{\{\w+\}\}/u);

// import KeyboardAction from '@nut-tree-fork/libnut/dist/lib/libnut-keyboard.class.js';
// const possibleKeys: string[] = [...KeyboardAction.KeyLookupMap.values()] as string[];
// eslint-disable-next-line  max-len
const keySchema = z.enum(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7', 'f8', 'f9', 'f10', 'f11', 'f12', 'f13', 'f14', 'f15', 'f16', 'f17', 'f18', 'f19', 'f20', 'f21', 'f22', 'f23', 'f24', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'numpad_0', 'numpad_1', 'numpad_2', 'numpad_3', 'numpad_4', 'numpad_5', 'numpad_6', 'numpad_7', 'numpad_8', 'numpad_9', 'numpad_decimal', 'space', 'escape', 'tab', 'alt', 'control', 'right_alt', 'right_control', 'win', 'right_win', 'cmd', 'right_cmd', 'menu', 'fn', 'shift', 'command', 'right_shift', 'command', '`', '-', '=', 'backspace', '[', ']', '\\', ';', '\'', 'enter', ',', '.', '/', 'left', 'up', 'right', 'down', 'printscreen', 'insert', 'delete', 'home', 'end', 'pageup', 'pagedown', 'add', 'subtract', 'multiply', 'divide', 'enter', 'caps_lock', 'scroll_lock', 'num_lock', 'audio_mute', 'audio_vol_down', 'audio_vol_up', 'audio_play', 'audio_stop', 'audio_pause', 'audio_prev', 'audio_next', 'audio_rewind', 'audio_forward', 'audio_repeat', 'audio_random']);

const delaySchema = z.object({
  delay: z.union([z.number(), variableSchema]).optional()
    .describe('Delay in milliseconds before the next command.'),
});

const baseSchema = z.object({
  destination: z.string()
    .describe('Remote PC from ips or aliases section to send this command to'),
}).merge(delaySchema);


const keyPressCommandSchema = z.object({
  keySend: z.union([keySchema, variableSchema])
    .describe('A key to be sent.'),
}).merge(baseSchema).describe('Sends a keyPress to a remote PC.');


const launchExeCommandSchema = z.object({
  launch: z.string().describe('Full path to an executable.'),
}).merge(baseSchema).describe('Starts a program on a remote PC.');

const runMacroCommandSchema = z.object({
  macro: z.string().describe('Name of the macro (key from macros section object)'),
  variables: z.record(z.any()).optional().describe('Object of a key-values of variable name and value'),
}).merge(delaySchema).describe('Runs a macro from the macros section.');

const typeTextCommandSchema = z.object({
  typeText: z.string().describe('Any string to type'),
}).merge(baseSchema).describe('Types text on the remote PC.');

const mouseClickCommandSchema = z.object({
  mouseMoveX: z.number().describe('X coordinate'),
  mouseMoveY: z.number().describe('Y coordinate'),
}).merge(baseSchema).describe('Moves mouse to specified coordinates and clicks with left button');

const killExeCommandSchema = z.object({
  kill: z.string().describe('Executable file name. E.g. Chrome.exe'),
}).merge(baseSchema).describe('Kills a process on the remote PC.');

const commandSchema = z.union([
  keyPressCommandSchema,
  mouseClickCommandSchema,
  launchExeCommandSchema,
  typeTextCommandSchema,
  killExeCommandSchema,
]).describe('A remote command');


const commandOrMacroSchema = z.union([
  commandSchema,
  runMacroCommandSchema,
]).describe('A remote command or a macro name');

type ReceiveTypeText = z.infer<typeof typeTextCommandSchema>
type ReceiveMacro = z.infer<typeof runMacroCommandSchema>
type ReceiverSimple = z.infer<typeof keyPressCommandSchema>
type ReceiverBase = z.infer<typeof baseSchema>
type ReceiverMouse = z.infer<typeof mouseClickCommandSchema>
type ReceiveExecute = z.infer<typeof launchExeCommandSchema>
type Receiver = z.infer<typeof commandSchema>
type KeySend = z.infer<typeof keySchema>;
type ReceiverAndMacro = z.infer<typeof commandOrMacroSchema>
type ReceiverKill = z.infer<typeof killExeCommandSchema>

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
  ReceiverKill,
};
export {
  keyPressCommandSchema,
  launchExeCommandSchema,
  typeTextCommandSchema,
  runMacroCommandSchema,
  mouseClickCommandSchema,
  killExeCommandSchema,
  commandSchema,
  commandOrMacroSchema,
};

