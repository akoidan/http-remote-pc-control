/* eslint-disable max-lines */
import {BadRequestException, Inject, Injectable, Logger, NotImplementedException} from '@nestjs/common';
import {UIWindow} from '@/window/window-model';
import {INativeModule, MonitorBounds, Native, WindowAction, WindowBounds} from '@/native/native-model';
import {OS_INJECT} from '@/window/window-consts';
import {ActiveWindowResponseDto, WindowResponse} from '@/window/window-dto';

@Injectable()
export class WindowService {
  constructor(
    private readonly logger: Logger,
    @Inject(Native)
    private readonly addon: INativeModule,
    @Inject(OS_INJECT)
    private readonly os: NodeJS.Platform,
  ) {
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  public async getAllWindowsByPid(pid: number): Promise<number[]> {
    return this.addon.getWindowsByProcessId(pid);
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  public async getActiveWindowInfo(): Promise<WindowResponse> {
    if (!['win32', 'linux'].includes(this.os)) {
      throw new NotImplementedException(`Unsupported platform: ${this.os}`);
    }
    const windowsRaw = this.addon.getActiveWindowInfo();
    this.logger.debug(`Found following windows ids ${JSON.stringify(windowsRaw)}`);
    if (!windowsRaw.wid) {
      throw new BadRequestException('Error detecting active window');
    }
    return windowsRaw;
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  public async focusWindowId(wid: number): Promise<void> {
    try {
      this.logger.log(`Focusing window: \u001b[35m#${wid}`);
      this.addon.bringWindowToTop(wid);
    } catch (e) {
      throw new BadRequestException(`Unable to focus window ${wid} because ${e?.message}`);
    }
  }

  // Extended window operations following consistent logging and error handling
  public getActiveWindow(): number {
    try {
      this.logger.log('Calling getActiveWindow');
      return this.addon.getActiveWindow();
    } catch (e) {
      throw new BadRequestException(`Unable to get active window because ${e?.message}`);
    }
  }

  public getWindowBounds(wid: number): WindowBounds {
    if (!['win32', 'linux'].includes(this.os)) {
      throw new NotImplementedException(`Unsupported platform: ${this.os}`);
    }
    try {
      this.logger.log(`Calling getWindowBounds for #${wid}`);
      return this.addon.getWindowBounds(wid);
    } catch (e) {
      throw new BadRequestException(`Unable to get window #${wid} bounds because ${e?.message}`);
    }
  }

  public getWindowInfo(wid: number): WindowResponse {
    if (!['win32', 'linux'].includes(this.os)) {
      throw new NotImplementedException(`Unsupported platform: ${this.os}`);
    }
    try {
      this.logger.log(`Calling getWindowBounds for #${wid}`);
      return this.addon.getWindowBounds(wid);
    } catch (e) {
      throw new BadRequestException(`Unable to get window #${wid} bounds because ${e?.message}`);
    }
  }

  public setWindowBounds(wid: number, bounds: MonitorBounds): void {
    try {
      this.logger.log(`Calling setWindowBounds for #${wid} to ${JSON.stringify(bounds)}`);
      this.addon.setWindowBounds(wid, bounds);
    } catch (e) {
      // eslint-disable-next-line sonarjs/no-duplicate-string
      throw new BadRequestException(`Unable to set window #${wid} bounds: ${e?.message || 'Unknown error'}`);
    }
  }

  public getWindowTitle(wid: number): string {
    if (!['win32'].includes(this.os)) {
      throw new NotImplementedException(`Unsupported platform: ${this.os}`);
    }
    try {
      this.logger.log(`Calling getWindowTitle for #${wid}`);
      return this.addon.getWindowTitle(wid);
    } catch (e) {
      throw new BadRequestException(`Unable to get window #${wid} title because ${e?.message}`);
    }
  }

  public showWindow(wid: number, type: WindowAction): void {
    if (!['win32'].includes(this.os)) {
      throw new NotImplementedException(`Unsupported platform: ${this.os}`);
    }
    try {
      this.logger.log(`Calling showWindow for #${wid} with action ${type}`);
      this.addon.showWindow(wid, type);
    } catch (e) {
      throw new BadRequestException(`Unable to show window #${wid} (${type}): ${e?.message || 'Unknown error'}`);
    }
  }

  public getWindowOpacity(wid: number): number {
    if (!['win32'].includes(this.os)) {
      throw new NotImplementedException(`Unsupported platform: ${this.os}`);
    }
    try {
      this.logger.log(`Calling getWindowOpacity for #${wid}`);
      return this.addon.getWindowOpacity(wid);
    } catch (e) {
      throw new BadRequestException(`Unable to get window #${wid} opacity because ${e?.message}`);
    }
  }

  public setWindowOpacity(wid: number, opacity: number): void {
    if (!['win32'].includes(this.os)) {
      throw new NotImplementedException(`Unsupported platform: ${this.os}`);
    }
    try {
      this.logger.log(`Calling setWindowOpacity for #${wid} to ${opacity}`);
      this.addon.setWindowOpacity(wid, opacity);
    } catch (e) {
      throw new BadRequestException(`Unable to set window #${wid} opacity: ${e?.message || 'Unknown error'}`);
    }
  }

  public toggleWindowTransparency(wid: number, toggle: boolean): void {
    if (!['win32'].includes(this.os)) {
      throw new NotImplementedException(`Unsupported platform: ${this.os}`);
    }
    try {
      this.logger.log(`Calling toggleWindowTransparency for #${wid} to ${toggle}`);
      this.addon.toggleWindowTransparency(wid, toggle);
    } catch (e) {
      throw new BadRequestException(`Unable to toggle window #${wid} transparency: ${e?.message || 'Unknown error'}`);
    }
  }

  public getWindowOwner(wid: number): number {
    if (!['win32'].includes(this.os)) {
      throw new NotImplementedException(`Unsupported platform: ${this.os}`);
    }
    try {
      this.logger.log(`Calling getWindowOwner for #${wid}`);
      return this.addon.getWindowOwner(wid);
    } catch (e) {
      throw new BadRequestException(`Unable to get window #${wid} owner because ${e?.message}`);
    }
  }

  public setWindowOwner(wid: number, owner: number): void {
    if (!['win32'].includes(this.os)) {
      throw new NotImplementedException(`Unsupported platform: ${this.os}`);
    }
    try {
      this.logger.log(`Calling setWindowOwner for #${wid} to ${owner}`);
      this.addon.setWindowOwner(wid, owner);
    } catch (e) {
      throw new BadRequestException(`Unable to set window #${wid} owner: ${e?.message || 'Unknown error'}`);
    }
  }

  public isWindow(wid: number): boolean {
    if (!['win32'].includes(this.os)) {
      throw new NotImplementedException(`Unsupported platform: ${this.os}`);
    }
    try {
      this.logger.log(`Calling isWindow for #${wid}`);
      return this.addon.isWindow(wid);
    } catch (e) {
      throw new BadRequestException(`Unable to check if handle #${wid} is window because ${e?.message}`);
    }
  }

  public isWindowVisible(wid: number): boolean {
    if (!['win32'].includes(this.os)) {
      throw new NotImplementedException(`Unsupported platform: ${this.os}`);
    }
    try {
      this.logger.log(`Calling isWindowVisible for #${wid}`);
      return this.addon.isWindowVisible(wid);
    } catch (e) {
      throw new BadRequestException(`Unable to check window #${wid} visibility because ${e?.message}`);
    }
  }

  public redrawWindow(wid: number): void {
    if (!['win32'].includes(this.os)) {
      throw new NotImplementedException(`Unsupported platform: ${this.os}`);
    }
    try {
      this.logger.log(`Calling redrawWindow for #${wid}`);
      this.addon.redrawWindow(wid);
    } catch (e) {
      throw new BadRequestException(`Unable to redraw window #${wid}: ${e?.message || 'Unknown error'}`);
    }
  }
}



