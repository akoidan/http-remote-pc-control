export interface IExecuteService {
  launchExe(pathToExe: string, args: string[], waitTillFinish: boolean): Promise<number>;

  killExeByName(name: string): Promise<boolean>;

  killExeByPid(pid: number): Promise<boolean>;

  findPidByName(name: string): Promise<number[]>;
}

export const ExecuteService = 'ExecuteService';
