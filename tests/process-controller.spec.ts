import {Test, TestingModule} from '@nestjs/testing';
import {INestApplication, Logger} from '@nestjs/common';
import request, {Response} from 'supertest';
import {ProcessController} from '../src/process/process-controller';
import {ProcessService} from '../src/process/process-service';
import {INativeModule, Native} from '../src/native/native-model';
import {IExecuteService, ExecuteService} from '../src/process/process-model';
import {LaunchExeRequestDto, ExecutableNameRequestDto} from '../src/process/process-dto';
import {OS_INJECT} from '../src/global/global-model';
import {createMockNativeService, createMockLogger, setupValidationPipe} from './test-utils';

describe('ProcessController (e2e)', () => {
  let app: INestApplication;
  let nativeService: jest.Mocked<INativeModule>;
  let executionService: jest.Mocked<IExecuteService>;

  beforeAll(async () => {
    const mockNativeService = createMockNativeService();
    
    const mockExecutionService: jest.Mocked<IExecuteService> = {
      launchExe: jest.fn().mockResolvedValue(123),
      killExeByName: jest.fn().mockResolvedValue(undefined),
      findPidByName: jest.fn().mockResolvedValue([123, 456]),
      killExeByPid: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProcessController],
      providers: [
        ProcessService,
        {provide: Native, useValue: mockNativeService},
        {provide: ExecuteService, useValue: mockExecutionService},
        {provide: OS_INJECT, useValue: 'linux'},
        {provide: Logger, useValue: createMockLogger()},
      ],
    })
      .compile();

    app = module.createNestApplication();
    setupValidationPipe(app);
    nativeService = module.get<jest.Mocked<INativeModule>>(Native);
    executionService = module.get<jest.Mocked<IExecuteService>>(ExecuteService);
    
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /process/:pid', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should return process info for valid PID', () => {
      return request(app.getHttpServer())
        .get('/process/123')
        .expect(200)
        .expect((res: Response) => {
          expect(res.body).toHaveProperty('pid');
          expect(res.body).toHaveProperty('path');
          expect(res.body).toHaveProperty('isElevated');
          expect(res.body).toHaveProperty('memory');
          expect(res.body).toHaveProperty('times');
        });
    });

    it('should return 400 for invalid PID (negative)', () => {
      return request(app.getHttpServer())
        .get('/process/-1')
        .expect(400);
    });

    it('should return 400 for invalid PID (non-integer)', () => {
      return request(app.getHttpServer())
        .get('/process/abc')
        .expect(400);
    });

    it('should return 404 for non-existent PID', () => {
      nativeService.getProcessInfo.mockImplementation(() => {
        throw new Error('Process not found');
      });

      return request(app.getHttpServer())
        .get('/process/999')
        .expect(404);
    });
  });

  describe('POST /process', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should launch new process', () => {
      const processData: LaunchExeRequestDto = {
        path: '/usr/bin/test-app',
        arguments: ['--verbose'],
        waitTillFinish: true
      };

      return request(app.getHttpServer())
        .post('/process')
        .send(processData)
        .expect(201)
        .expect((res: Response) => {
          expect(res.body).toHaveProperty('pid');
          expect(res.body).toHaveProperty('path');
          expect(executionService.launchExe).toHaveBeenCalledWith(processData);
        });
    });

    it('should return 400 for missing path', () => {
      const processData = {
        arguments: ['--verbose'],
        waitTillFinish: true
      };

      return request(app.getHttpServer())
        .post('/process')
        .send(processData)
        .expect(400)
        .expect((res: Response) => {
          expect(res.body).toHaveProperty('message');
          expect(Array.isArray(res.body.message)).toBe(true);
          expect(res.body.message[0]).toContain('path');
        });
    });
  });

  describe('DELETE /process', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should kill process by name', () => {
      return request(app.getHttpServer())
        .delete('/process?name=test-app')
        .expect(204)
        .then(() => {
          expect(executionService.killExeByName).toHaveBeenCalledWith('test-app');
        });
    });

    it('should return 400 for missing name parameter', () => {
      return request(app.getHttpServer())
        .delete('/process')
        .expect(400)
        .expect((res: Response) => {
          expect(res.body).toHaveProperty('message');
          expect(Array.isArray(res.body.message)).toBe(true);
        });
    });

    it('should return 400 for empty name parameter', () => {
      return request(app.getHttpServer())
        .delete('/process?name=')
        .expect(400)
        .expect((res: Response) => {
          expect(res.body).toHaveProperty('message');
          expect(Array.isArray(res.body.message)).toBe(true);
        });
    });
  });

  describe('GET /process (find by name)', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should find PIDs by process name', () => {
      return request(app.getHttpServer())
        .get('/process?name=test-app')
        .expect(200)
        .expect((res: Response) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body).toEqual([123, 456]);
          expect(executionService.findPidByName).toHaveBeenCalledWith('test-app');
        });
    });

    it('should return 400 for missing name parameter', () => {
      return request(app.getHttpServer())
        .get('/process')
        .expect(400)
        .expect((res: Response) => {
          expect(res.body).toHaveProperty('message');
          expect(Array.isArray(res.body.message)).toBe(true);
        });
    });
  });

  describe('DELETE /process/:pid', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should kill process by PID', () => {
      return request(app.getHttpServer())
        .delete('/process/123')
        .expect(204)
        .then(() => {
          expect(executionService.killExeByPid).toHaveBeenCalledWith(123);
        });
    });

    it('should return 400 for invalid PID (negative)', () => {
      return request(app.getHttpServer())
        .delete('/process/-1')
        .expect(400);
    });

    it('should return 400 for invalid PID (non-integer)', () => {
      return request(app.getHttpServer())
        .delete('/process/abc')
        .expect(400);
    });

    it('should return 404 for non-existent PID', () => {
      executionService.killExeByPid.mockImplementation(() => {
        throw new Error('Process not found');
      });

      return request(app.getHttpServer())
        .delete('/process/999')
        .expect(404);
    });
  });
});
