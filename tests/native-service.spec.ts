import { Test, TestingModule } from '@nestjs/testing';
import { NativeModule } from '../src/native/native-module';
import { INativeModule, Native, WindowAction, MouseButton } from '../src/native/native-model';

describe('NativeService', () => {
  let nativeService: INativeModule;
  let testPid: number;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [NativeModule],
    }).compile();

    nativeService = module.get<INativeModule>(Native);
    testPid = process.pid; // Using current process for testing
  });

  describe('Window Management', () => {
    it('should get active window ID', () => {
      const windowId = nativeService.getWindowActiveId();
      expect(typeof windowId).toBe('number');
      expect(windowId).toBeGreaterThan(0);
    });

    it('should get window info', () => {
      const windowId = nativeService.getWindowActiveId();
      const windowInfo = nativeService.getWindowInfo(windowId);

      expect(windowInfo).toHaveProperty('wid');
      expect(windowInfo).toHaveProperty('pid');
      expect(windowInfo).toHaveProperty('bounds');
      expect(windowInfo.bounds).toHaveProperty('x');
      expect(windowInfo.bounds).toHaveProperty('y');
      expect(windowInfo.bounds).toHaveProperty('width');
      expect(windowInfo.bounds).toHaveProperty('height');
    });

    it('should set window bounds', () => {
      const windowId = nativeService.getWindowActiveId();
      const originalBounds = nativeService.getWindowInfo(windowId).bounds;
      const newBounds = {
        x: originalBounds.x + 10,
        y: originalBounds.y + 10,
        width: originalBounds.width,
        height: originalBounds.height
      };

      nativeService.setWindowBounds(windowId, newBounds);
      const updatedBounds = nativeService.getWindowInfo(windowId).bounds;

      expect(updatedBounds.x).toBe(newBounds.x);
      expect(updatedBounds.y).toBe(newBounds.y);
    });

    it('should change window state', () => {
      const windowId = nativeService.getWindowActiveId();

      // Test minimize
      nativeService.setWindowState(windowId, WindowAction.MINIMIZE);
      // Note: We can't easily verify the window state programmatically without additional APIs

      // Test restore
      nativeService.setWindowState(windowId, WindowAction.RESTORE);

      // Test maximize
      nativeService.setWindowState(windowId, WindowAction.MAXIMIZE);
    });

    it('should change window opacity', () => {
      const windowId = nativeService.getWindowActiveId();
      nativeService.setWindowOpacity(windowId, 1);
      // Note: We can't easily verify opacity change without additional APIs
    });

    it('should get windows by process ID', () => {
      const windowHandles = nativeService.getWindowsByProcessId(testPid);
      expect(Array.isArray(windowHandles)).toBe(true);

      if (windowHandles.length > 0) {
        const windowInfo = nativeService.getWindowInfo(windowHandles[0]);
        expect(windowInfo.pid).toBe(testPid);
      }
    });
  });

  describe('Monitor Management', () => {
    it('should get monitors', () => {
      const monitors = nativeService.getMonitors();
      expect(Array.isArray(monitors)).toBe(true);

      if (monitors.length > 0) {
        const monitorInfo = nativeService.getMonitorInfo(monitors[0]);
        expect(monitorInfo).toHaveProperty('bounds');
        expect(monitorInfo).toHaveProperty('workArea');
        expect(monitorInfo).toHaveProperty('scale');
        expect(monitorInfo).toHaveProperty('isPrimary');
      }
    });

    it('should get monitor from window', () => {
      const windowId = nativeService.getWindowActiveId();
      const monitorId = nativeService.getMonitorFromWindow(windowId);
      expect(typeof monitorId).toBe('number');
    });
  });

  describe('Process Management', () => {
    it('should check if process is elevated', () => {
      const isElevated = nativeService.isProcessElevated();
      expect(typeof isElevated).toBe('boolean');
    });

    it('should get process info for current process', () => {
      const processInfo = nativeService.getProcessInfo(testPid);
      
      expect(processInfo).toHaveProperty('processId');
      expect(processInfo).toHaveProperty('exePath');
      expect(processInfo).toHaveProperty('isElevated');
      expect(processInfo).toHaveProperty('memory');
      expect(processInfo).toHaveProperty('times');
      
      expect(typeof processInfo.parentPid).toBe('number');
      expect(typeof processInfo.path).toBe('string');
      expect(typeof processInfo.isElevated).toBe('boolean');
      
      // Check memory object structure
      expect(processInfo.memory).toHaveProperty('workingSetSize');
      expect(processInfo.memory).toHaveProperty('peakWorkingSetSize');
      expect(processInfo.memory).toHaveProperty('privateUsage');
      expect(processInfo.memory).toHaveProperty('pagefileUsage');
      
      expect(typeof processInfo.memory.workingSetSize).toBe('number');
      expect(typeof processInfo.memory.peakWorkingSetSize).toBe('number');
      expect(typeof processInfo.memory.privateUsage).toBe('number');
      expect(typeof processInfo.memory.pageFileUsage).toBe('number');
      
      // Check times object structure
      expect(processInfo.times).toHaveProperty('creationTime');
      expect(processInfo.times).toHaveProperty('kernelTime');
      expect(processInfo.times).toHaveProperty('userTime');
      
      expect(typeof processInfo.times.creationTime).toBe('number');
      expect(typeof processInfo.times.kernelTime).toBe('number');
      expect(typeof processInfo.times.userTime).toBe('number');
      
      // Verify the process ID matches
      expect(processInfo.pid).toBe(testPid);
      
      // Verify exe path is not empty
      expect(processInfo.path.length).toBeGreaterThan(0);
      
      // Verify memory values are positive
      expect(processInfo.memory.workingSetSize).toBeGreaterThan(0);
      expect(processInfo.memory.peakWorkingSetSize).toBeGreaterThan(0);
      expect(processInfo.memory.privateUsage).toBeGreaterThan(0);
      expect(processInfo.memory.pageFileUsage).toBeGreaterThan(0);
    });

    it('should throw error for invalid process ID', () => {
      expect(() => {
        nativeService.getProcessInfo(999999);
      }).toThrow();
    });
  });

  describe('Keyboard Operations', () => {
    it('should type a string', () => {
      // This will actually type, so be careful with this test
      // nativeService.typeString('Test');
    });

    it('should simulate key tap', () => {
      // nativeService.keyTap('a', []);
    });
  });

  describe('Mouse Operations', () => {
    it('should get and set mouse position', () => {
      const originalPos = nativeService.getMousePosition();
      expect(originalPos).toHaveProperty('x');
      expect(originalPos).toHaveProperty('y');

      const newPos = { x: originalPos.x + 10, y: originalPos.y + 10 };
      nativeService.setMousePosition(newPos);

      const updatedPos = nativeService.getMousePosition();
      // Allow for small variations in position (up to 2 pixels)
      expect(Math.abs(updatedPos.x - newPos.x)).toBeLessThanOrEqual(2);
      expect(Math.abs(updatedPos.y - newPos.y)).toBeLessThanOrEqual(2);
    });

    it('should simulate mouse button press', () => {
      // Test left button down/up
      nativeService.setMouseButtonToState(MouseButton.LEFT, true);
      nativeService.setMouseButtonToState(MouseButton.LEFT, false);
    });
  });
});