import {LaunchExeRequest} from "@/process/process-dto";

export interface IExecuteService {
  launchExe(data: LaunchExeRequest): Promise<number>;

  killExeByName(name: string): Promise<void>;

  killExeByPid(pid: number): Promise<void>;

  findPidByName(name: string): Promise<number[]>;
}

export const ExecuteService = 'ExecuteService';
