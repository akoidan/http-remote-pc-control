interface IKeyboardService {
  type(text: string): Promise<void>;
  sendKey(keys: string[], holdKeys: string[], duration?: number): Promise<void>;
}


export const KeyboardService = 'KeyboardService';

export type {
  IKeyboardService,
};
