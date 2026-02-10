export interface IExecuteService {
  launchExe(pathToExe: string, args: string[], waitTillFinish: boolean): Promise<number>;

  killExeByName(name: string): Promise<void>;

  killExeByPid(pid: number): Promise<void>;

  findPidByName(name: string): Promise<number[]>;
}

export const ExecuteService = 'ExecuteService';
