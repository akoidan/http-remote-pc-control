import {Test, TestingModule} from '@nestjs/testing';
import {INestApplication} from '@nestjs/common';
import request, {Response} from 'supertest';
import {AppModule} from '../src/app/app.module';
import {INativeModule, Native} from '../src/native/native-model';
import {createMockNativeService} from './test-utils';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let nativeService: jest.Mocked<INativeModule>;

  beforeAll(async () => {
    const mockNativeService = createMockNativeService();

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
