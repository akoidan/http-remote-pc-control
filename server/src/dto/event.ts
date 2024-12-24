import { KeySend } from '@/types';

export interface MouseClickRequest {
  x: number;
  y: number;
}

export interface SendKeyRequest {
  key: KeySend;
}

export interface LaunchExeRequest {
  path: string;
}

export interface TypeTextRequest {
  text: string;
}
