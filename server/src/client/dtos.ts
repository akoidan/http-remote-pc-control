import type {Key} from '@/config/types/commands';

interface MouseClickRequest {
  x: number;
  y: number;
}

interface SendKeyRequest {
  keys: Key[];
  holdKeys: Key[];
}

interface FocusExeRequest {
  pid: number;
}

interface LaunchExeRequest {
  path: string;
  arguments: string[];
  waitTillFinish: boolean;
}

interface KillExeByNameRequest {
  name: string;
}

interface KillExeByPidRequest {
  pid: number;
}

interface TypeTextRequest {
  text: string;
}

interface LaunchPidResponse {
  pid: number;
}

export type {
  MouseClickRequest,
  SendKeyRequest,
  FocusExeRequest,
  LaunchPidResponse,
  LaunchExeRequest,
  TypeTextRequest,
  KillExeByNameRequest,
  KillExeByPidRequest
};
