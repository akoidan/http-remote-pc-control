import {Test, TestingModule} from '@nestjs/testing';
import {INestApplication, Logger} from '@nestjs/common';
import request, {Response} from 'supertest';
import {INativeModule, Native} from '../src/native/native-model';
import {createMockLogger, createMockNativeService, setupValidationPipe} from './test-utils';
import {AppController} from "../src/app/app-controller";
import {OS_INJECT} from "../src/global/global-model";

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let nativeService: jest.Mocked<INativeModule>;


  beforeAll(async () => {
    const mockNativeService = createMockNativeService();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {provide: Native, useValue: mockNativeService},
        {provide: OS_INJECT, useValue: 'linux'},
        {provide: Logger, useValue: createMockLogger()},
      ],
    })
        .compile();

    app = module.createNestApplication();
    setupValidationPipe(app);
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
      
      // Clean up the spy immediately
      spy.mockRestore();
    });
  });
});
