import {Inject, Injectable, Logger} from '@nestjs/common';
import {Native, ProcessNativeModule, WindowNativeModule} from '@/native/native-model';
import {Safe400} from '@/utils/decorators';
import {OS_INJECT} from '@/global/global-model';
import {LaunchExeRequest, LaunchExeRequestDto, ProcessResponseDto} from '@/process/process-dto';
import {ExecuteService, IExecuteService} from '@/process/process-model';

@Injectable()
export class ProcessService {
  constructor(
    public readonly logger: Logger,
    @Inject(ExecuteService)
    private readonly executionService: IExecuteService,
    @Inject(Native)
    private readonly addonProcess: ProcessNativeModule,
    @Inject(Native)
    private readonly addonWindow: WindowNativeModule,
    @Inject(OS_INJECT)
    public readonly os: NodeJS.Platform,
  ) {
  }

  @Safe400(['win32', 'linux'])
  public async createProcess(data: LaunchExeRequest): Promise<ProcessResponseDto> {
    const pid = await this.executionService.launchExe(data);
    return this.getProcessInfo(pid);
  }

  @Safe400(['win32', 'linux'])
  public getProcessInfo(pid: number): ProcessResponseDto {
    const info = this.addonProcess.getProcessInfo(pid);
    const wids = this.addonWindow.getWindowsByProcessId(pid);
    return {
      ...info,
      wids,
    };
  }
}
