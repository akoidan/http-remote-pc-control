import {INativeModule} from '../src/native/native-model';
import {RandomService} from '../src/random/random-service';
import {ZodValidationPipe} from '@anatine/zod-nestjs';
import {INestApplication} from '@nestjs/common';

/**
 * Creates a comprehensive mock for the native service
 */
export const createMockNativeService = (): jest.Mocked<INativeModule> => ({
  path: '/mock/path/native.node',
  
  // Window methods
  setWindowActive: jest.fn().mockReturnValue(true),
  getWindowActiveId: jest.fn().mockReturnValue(123),
  getWindowsByProcessId: jest.fn().mockReturnValue([123, 456]),
  setWindowState: jest.fn(),
  getWindowInfo: jest.fn().mockReturnValue({
    wid: 123,
    pid: 456,
    bounds: {x: 0, y: 0, width: 800, height: 600},
    opacity: 1,
    title: 'Test Window',
    parentWid: 0
  }),
  setWindowBounds: jest.fn(),
  setWindowOpacity: jest.fn(),
  setWindowAttached: jest.fn(),
  createTestWindow: jest.fn().mockReturnValue(123),
  
  // Monitor methods
  getMonitors: jest.fn().mockReturnValue([1, 2]),
  getMonitorFromWindow: jest.fn().mockReturnValue(1),
  getMonitorInfo: jest.fn().mockReturnValue({
    bounds: {x: 0, y: 0, width: 1920, height: 1080},
    workArea: {x: 0, y: 0, width: 1920, height: 1040},
    scale: 1,
    isPrimary: true
  }),
  
  // Process methods
  isProcessElevated: jest.fn().mockReturnValue(false),
  getProcessInfo: jest.fn().mockReturnValue({
    pid: 123,
    parentPid: 1,
    threadCount: 5,
    path: '/test/path',
    isElevated: false,
    memory: {
      workingSetSize: 1000000,
      peakWorkingSetSize: 2000000,
      privateUsage: 500000,
      pageFileUsage: 750000
    },
    times: {
      creationTime: Date.now(),
      kernelTime: 1000,
      userTime: 2000
    }
  }),
  
  // Keyboard methods
  typeString: jest.fn(),
  keyTap: jest.fn(),
  keyToggle: jest.fn(),
  setKeyboardLayout: jest.fn(),
  
  // Mouse methods
  setMouseButtonToState: jest.fn(),
  setMousePosition: jest.fn(),
  getMousePosition: jest.fn().mockReturnValue({x: 100, y: 200}),
});

/**
 * Creates a mock for RandomService
 */
export const createMockRandomService = (): jest.Mocked<RandomService> => ({
  calcDeviation: jest.fn().mockReturnValue(100),
} as any);

/**
 * Creates a mock Logger
 */
export const createMockLogger = () => ({
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  verbose: jest.fn(),
});

/**
 * Sets up global validation pipe for testing
 */
export const setupValidationPipe = (app: INestApplication): void => {
  app.useGlobalPipes(new ZodValidationPipe());
};
