import type {Key} from '@/config/types/commands';

interface MouseClickRequest {
  x: number;
  y: number;
}

interface SendKeyRequest {
  keys: Key[];
  holdKeys: Key[];
}

interface LaunchExeRequest {
  path: string;
  arguments: string[];
  waitTillFinish: boolean;
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
