import {Test, TestingModule} from '@nestjs/testing';
import {INestApplication} from '@nestjs/common';
import request, {Response} from 'supertest';
import {AppModule} from '../src/app/app.module';
import {INativeModule, Native} from '../src/native/native-model';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let nativeService: jest.Mocked<INativeModule>;

  beforeAll(async () => {
    // Create a comprehensive mock for the native service
    const mockNativeService: jest.Mocked<INativeModule> = {
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
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(Native)
      .useValue(mockNativeService)
      .compile();

    app = module.createNestApplication();
    nativeService = module.get<jest.Mocked<INativeModule>>(Native);
    
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /app/ping', () => {
    it('should return ping response with status ok and version', () => {
      return request(app.getHttpServer())
        .get('/app/ping')
        .expect(200)
        .expect((res: Response) => {
          expect(res.body).toHaveProperty('status', 'ok');
          expect(res.body).toHaveProperty('version');
          expect(typeof res.body.version).toBe('string');
        });
    });

    it('should return a valid version string', () => {
      return request(app.getHttpServer())
        .get('/app/ping')
        .expect(200)
        .expect((res: Response) => {
          // Version should follow semantic versioning pattern (x.y.z or x.y.z-alpha.n, etc.)
          const versionRegex = /^\d+\.\d+\.\d+(-[\w.]+)?$/;
          expect(res.body.version).toMatch(versionRegex);
        });
    });

    it('should have NativeModule mock properly set up', () => {
      // Verify that our mock is being used
      expect(nativeService.isProcessElevated).toBeDefined();
      expect(typeof nativeService.isProcessElevated).toBe('function');
      
      // Test that we can spy on the mock
      const spy = jest.spyOn(nativeService, 'isProcessElevated');
      nativeService.isProcessElevated();
      expect(spy).toHaveBeenCalled();
      
      // Reset the spy
      spy.mockRestore();
    });
  });
});
