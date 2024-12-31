import type {Key} from '@/config/types/commands';

interface MouseClickRequest {
  x: number;
  y: number;
}

interface SendKeyRequest {
  key: Key;
}

interface LaunchExeRequest {
  path: string;
  arguments: string[];
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
