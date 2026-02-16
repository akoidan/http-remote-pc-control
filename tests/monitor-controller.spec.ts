import {Test, TestingModule} from '@nestjs/testing';
import {INestApplication, Logger} from '@nestjs/common';
import request, {Response} from 'supertest';
import {MonitorController} from '../src/monitor/monitor-controller';
import {MonitorService} from '../src/monitor/monitor-service';
import {INativeModule, Native} from '../src/native/native-model';
import {OS_INJECT} from '../src/global/global-model';
import {createMockNativeService, createMockLogger, setupValidationPipe} from './test-utils';

describe('MonitorController (e2e)', () => {
  let app: INestApplication;
  let nativeService: jest.Mocked<INativeModule>;

  beforeAll(async () => {
    const mockNativeService = createMockNativeService();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MonitorController],
      providers: [
        MonitorService,
        {provide: Native, useValue: mockNativeService},
        {provide: OS_INJECT, useValue: process.platform},
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

  describe('GET /monitor', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should return list of monitors', () => {
      return request(app.getHttpServer())
        .get('/monitor')
        .expect(process.platform == 'win32' ? 200 : 400)
        .expect((res: Response) => {
          if (process.platform == 'win32') {
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body).toEqual([1, 2]);
            expect(nativeService.getMonitors).toHaveBeenCalled();
          } else {
            expect(res.body.message).toBe('Unsupported method getMonitors on platform linux');
          }
        });
    });
  });

  describe('GET /monitor/:mid/info', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should return monitor info for valid monitor ID', () => {
      return request(app.getHttpServer())
        .get('/monitor/1/info')
        .expect(200)
        .expect((res: Response) => {
          expect(res.body).toHaveProperty('bounds');
          expect(res.body).toHaveProperty('workArea');
          expect(res.body).toHaveProperty('scale');
          expect(res.body).toHaveProperty('isPrimary');
          expect(nativeService.getMonitorInfo).toHaveBeenCalledWith(1);
        });
    });

    it('should return 400 for invalid monitor ID', () => {
      return request(app.getHttpServer())
        .get('/monitor/asdf/info')
        .expect(400);
    });

    it('should return 400 for invalid monitor ID (non-integer)', () => {
      return request(app.getHttpServer())
        .get('/monitor/abc/info')
        .expect(400);
    });
  });
});
