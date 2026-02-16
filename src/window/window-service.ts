/* eslint-disable max-lines */
import {Inject, Injectable, Logger} from '@nestjs/common';
import {INativeModule, Native} from '@/native/native-model';
import {SetWindowPropertiesRequest, WindowResponse} from '@/window/window-dto';
import {Safe400} from '@/utils/decorators';
import {OS_INJECT} from '@/global/global-model';

@Injectable()
export class WindowService {
  constructor(
    public readonly logger: Logger,
    @Inject(Native)
    private readonly addon: INativeModule,
    @Inject(OS_INJECT)
    public readonly os: NodeJS.Platform,
  ) {
  }

  @Safe400(['win32', 'linux'])
  public getWindowsByProcessId(pid: number): number[] {
    return this.addon.getWindowsByProcessId(pid);
  }

  @Safe400(['win32', 'linux'])
  public getActiveWindowInfo(): WindowResponse {
    const wid = this.addon.getWindowActiveId();
    return this.addon.getWindowInfo(wid);
  }

  @Safe400(['win32', 'linux'])
  public setWindowActive(wid: number): void {
    this.addon.setWindowActive(wid);
  }

  @Safe400(['win32', 'linux'])
  public getWindowInfo(wid: number): WindowResponse {
    return this.addon.getWindowInfo(wid);
  }

  @Safe400(['win32', 'linux'])
  public setWindowProperties(wid: number, windowState: SetWindowPropertiesRequest): void {
    if (windowState.opacity) {
      this.addon.setWindowOpacity(wid, windowState.opacity);
    }
    if (windowState.bounds) {
      this.addon.setWindowBounds(wid, windowState.bounds);
    }
    if (windowState.state) {
      this.addon.setWindowState(wid, windowState.state);
    }
  }

  @Safe400(['win32'])
  public setWindowAttached(wid: number): void {
    this.addon.setWindowAttached(wid);
  }
}



