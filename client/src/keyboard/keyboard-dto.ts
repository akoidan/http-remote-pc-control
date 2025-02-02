import {z} from 'zod';

// eslint-disable-next-line  max-len
const keySchema = z.enum(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7', 'f8', 'f9', 'f10', 'f11', 'f12', 'f13', 'f14', 'f15', 'f16', 'f17', 'f18', 'f19', 'f20', 'f21', 'f22', 'f23', 'f24', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'numpad_0', 'numpad_1', 'numpad_2', 'numpad_3', 'numpad_4', 'numpad_5', 'numpad_6', 'numpad_7', 'numpad_8', 'numpad_9', 'numpad_decimal', 'space', 'escape', 'tab', 'alt', 'control', 'right_alt', 'right_control', 'win', 'right_win', 'cmd', 'right_cmd', 'menu', 'fn', 'shift', 'command', 'right_shift', 'command', '`', '-', '=', 'backspace', '[', ']', '\\', ';', '\'', 'enter', ',', '.', '/', 'left', 'up', 'right', 'down', 'printscreen', 'insert', 'delete', 'home', 'end', 'pageup', 'pagedown', 'add', 'subtract', 'multiply', 'divide', 'enter', 'caps_lock', 'scroll_lock', 'num_lock', 'audio_mute', 'audio_vol_down', 'audio_vol_up', 'audio_play', 'audio_stop', 'audio_pause', 'audio_prev', 'audio_next', 'audio_rewind', 'audio_forward', 'audio_repeat', 'audio_random'])
  .describe('A key to be sent.');

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
export {keySchema, keyPressRequestSchema, typeTextRequestSchema};
