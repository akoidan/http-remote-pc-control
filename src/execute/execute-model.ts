export interface IExecuteService {
  launchExe(pathToExe: string, args: string[], waitTillFinish: boolean): Promise<number>;
  killExeByName(name: string): Promise<boolean>;
  killExeByPid(name: number): Promise<boolean>;
}

export const ExecuteService = 'ExecuteService';
