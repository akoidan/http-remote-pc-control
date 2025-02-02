export interface IExecuteService {
  launchExe(pathToExe: string, args: string[], waitTillFinish: boolean): Promise<number>;
  killExe(name: string): Promise<boolean>;
}

export const ExecuteService = 'ExecuteService';
