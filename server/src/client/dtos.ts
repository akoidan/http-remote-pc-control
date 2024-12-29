import type {KeySend} from '@/config/types/commands';

interface MouseClickRequest {
  x: number;
  y: number;
}

interface SendKeyRequest {
  key: KeySend;
}

interface LaunchExeRequest {
  path: string;
}

interface KillExeRequest {
  name: string;
}

interface TypeTextRequest {
  text: string;
}

export type {
  MouseClickRequest,
  SendKeyRequest,
  LaunchExeRequest,
  TypeTextRequest,
  KillExeRequest,
};
