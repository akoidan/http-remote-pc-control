import {Test, TestingModule} from '@nestjs/testing';
import {INestApplication, Logger} from '@nestjs/common';
import request, {Response} from 'supertest';
import {KeyboardController} from '../src/keyboard/keyboard-controller';
import {KeyboardService} from '../src/keyboard/keyboard-service';
import {INativeModule, Native} from '../src/native/native-model';
import {OS_INJECT} from '../src/global/global-model';
import {RandomService} from '../src/random/random-service';

describe('KeyboardController (e2e)', () => {
  let app: INestApplication;
  let nativeService: jest.Mocked<INativeModule>;

  beforeAll(async () => {
    // Create a mock for the native service with only keyboard-related methods
    const mockNativeService: jest.Mocked<INativeModule> = {
      path: '/mock/path/native.node',
      // Keyboard methods
      typeString: jest.fn(),
      keyTap: jest.fn(),
      keyToggle: jest.fn(),
      setKeyboardLayout: jest.fn(),
      // Add minimal required methods for other interfaces
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
      getMonitors: jest.fn().mockReturnValue([1, 2]),
      getMonitorFromWindow: jest.fn().mockReturnValue(1),
      getMonitorInfo: jest.fn().mockReturnValue({
        bounds: {x: 0, y: 0, width: 1920, height: 1080},
        workArea: {x: 0, y: 0, width: 1920, height: 1040},
        scale: 1,
        isPrimary: true
      }),
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
      setMouseButtonToState: jest.fn(),
      setMousePosition: jest.fn(),
      getMousePosition: jest.fn().mockReturnValue({x: 100, y: 200}),
    };

    // Mock RandomService
    const mockRandomService: jest.Mocked<RandomService> = {
      calcDeviation: jest.fn().mockReturnValue(100),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [KeyboardController],
      providers: [
        KeyboardService,
        {provide: Native, useValue: mockNativeService},
        {provide: OS_INJECT, useValue: 'linux'},
        {provide: Logger, useValue: {
          log: jest.fn(),
          error: jest.fn(),
          warn: jest.fn(),
          debug: jest.fn(),
          verbose: jest.fn(),
        }},
        {provide: RandomService, useValue: mockRandomService},
      ],
    })
      .compile();

    app = module.createNestApplication();
    nativeService = module.get<jest.Mocked<INativeModule>>(Native);
    
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /keyboard/key-press', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should call keyTap with correct parameters', () => {
      const keyPressData = {
        keys: ['a', 'b', 'c'],
        modifiers: ['ctrl']
      };

      return request(app.getHttpServer())
        .post('/keyboard/key-press')
        .send(keyPressData)
        .expect(204)
        .then(() => {
          // Verify that keyTap was called with correct parameters
          expect(nativeService.keyTap).toHaveBeenCalledWith('a', []);
          expect(nativeService.keyTap).toHaveBeenCalledWith('b', []);
          expect(nativeService.keyTap).toHaveBeenCalledWith('c', []);
          expect(nativeService.keyTap).toHaveBeenCalledTimes(3);
        });
    });

    it('should handle single key without modifiers', () => {
      const keyPressData = {
        keys: ['enter'],
        modifiers: []
      };

      return request(app.getHttpServer())
        .post('/keyboard/key-press')
        .send(keyPressData)
        .expect(204)
        .then(() => {
          expect(nativeService.keyTap).toHaveBeenCalledWith('enter', []);
          expect(nativeService.keyTap).toHaveBeenCalledTimes(1);
        });
    });
  });

  describe('POST /keyboard/type-text', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should call typeString with correct text', () => {
      const typeTextData = {
        text: 'Hello World!'
      };

      return request(app.getHttpServer())
        .post('/keyboard/type-text')
        .send(typeTextData)
        .expect(204)
        .then(() => {
          expect(nativeService.typeString).toHaveBeenCalledWith('Hello World!');
          expect(nativeService.typeString).toHaveBeenCalledTimes(1);
        });
    });

    it('should handle empty text', () => {
      const typeTextData = {
        text: ''
      };

      return request(app.getHttpServer())
        .post('/keyboard/type-text')
        .send(typeTextData)
        .expect(204)
        .then(() => {
          expect(nativeService.typeString).toHaveBeenCalledWith('');
          expect(nativeService.typeString).toHaveBeenCalledTimes(1);
        });
    });
  });

  describe('POST /keyboard/set-layout', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should call setKeyboardLayout with correct layout', () => {
      const layoutData = {
        layout: 'us'
      };

      return request(app.getHttpServer())
        .post('/keyboard/set-layout')
        .send(layoutData)
        .expect(204)
        .then(() => {
          expect(nativeService.setKeyboardLayout).toHaveBeenCalledWith('us');
          expect(nativeService.setKeyboardLayout).toHaveBeenCalledTimes(1);
        });
    });

    it('should handle different keyboard layouts', () => {
      const layoutData = {
        layout: 'de'
      };

      return request(app.getHttpServer())
        .post('/keyboard/set-layout')
        .send(layoutData)
        .expect(204)
        .then(() => {
          expect(nativeService.setKeyboardLayout).toHaveBeenCalledWith('de');
          expect(nativeService.setKeyboardLayout).toHaveBeenCalledTimes(1);
        });
    });
  });

  describe('NativeModule spy verification', () => {
    it('should have keyboard methods properly mocked', () => {
      expect(nativeService.typeString).toBeDefined();
      expect(nativeService.keyTap).toBeDefined();
      expect(nativeService.keyToggle).toBeDefined();
      expect(nativeService.setKeyboardLayout).toBeDefined();
      
      // Test that we can spy on keyboard methods
      const spy = jest.spyOn(nativeService, 'typeString');
      nativeService.typeString('test');
      expect(spy).toHaveBeenCalledWith('test');
      
      spy.mockRestore();
    });
  });
});
