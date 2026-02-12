import {Test, TestingModule} from '@nestjs/testing';
import {INestApplication, Logger} from '@nestjs/common';
import request, {Response} from 'supertest';
import {MouseController} from '../src/mouse/mouse-controller';
import {MouseService} from '../src/mouse/mouse-service';
import {INativeModule, Native} from '../src/native/native-model';
import {OS_INJECT} from '../src/global/global-model';
import {createMockNativeService, createMockLogger, setupValidationPipe} from './test-utils';

describe('MouseController (e2e)', () => {
  let app: INestApplication;
  let nativeService: jest.Mocked<INativeModule>;

  beforeAll(async () => {
    const mockNativeService = createMockNativeService();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MouseController],
      providers: [
        MouseService,
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

  describe('GET /mouse/position', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should return current mouse position', () => {
      return request(app.getHttpServer())
        .get('/mouse/position')
        .expect(200)
        .expect((res: Response) => {
          expect(res.body).toHaveProperty('x');
          expect(res.body).toHaveProperty('y');
          expect(res.body).toEqual({x: 100, y: 200});
          expect(nativeService.getMousePosition).toHaveBeenCalled();
        });
    });
  });

  describe('POST /mouse/move-left-click', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should move and left click at position', () => {
      const positionData = {x: 100, y: 200};

      return request(app.getHttpServer())
        .post('/mouse/move-left-click')
        .send(positionData)
        .expect(204)
        .then(() => {
          expect(nativeService.setMousePosition).toHaveBeenCalledWith(positionData);
          expect(nativeService.setMouseButtonToState).toHaveBeenCalled();
        });
    });

    it('should return 400 for missing x coordinate', () => {
      const positionData = {y: 200};

      return request(app.getHttpServer())
        .post('/mouse/move-left-click')
        .send(positionData)
        .expect(400)
        .expect((res: Response) => {
          expect(res.body).toHaveProperty('message');
          expect(Array.isArray(res.body.message)).toBe(true);
          expect(res.body.message[0]).toContain('x');
        });
    });

    it('should return 400 for missing y coordinate', () => {
      const positionData = {x: 100};

      return request(app.getHttpServer())
        .post('/mouse/move-left-click')
        .send(positionData)
        .expect(400)
        .expect((res: Response) => {
          expect(res.body).toHaveProperty('message');
          expect(Array.isArray(res.body.message)).toBe(true);
          expect(res.body.message[0]).toContain('y');
        });
    });
  });

  describe('POST /mouse/move', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should move mouse to position', () => {
      const positionData = {x: 150, y: 250};

      return request(app.getHttpServer())
        .post('/mouse/move')
        .send(positionData)
        .expect(204)
        .then(() => {
          expect(nativeService.setMousePosition).toHaveBeenCalledWith(positionData);
        });
    });

    it('should return 400 for missing coordinates', () => {
      const positionData = {};

      return request(app.getHttpServer())
        .post('/mouse/move')
        .send(positionData)
        .expect(400)
        .expect((res: Response) => {
          expect(res.body).toHaveProperty('message');
          expect(Array.isArray(res.body.message)).toBe(true);
        });
    });
  });

  describe('POST /mouse/move-human', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should move mouse in human pattern', () => {
      const moveData = {
        x: 100,
        y: 200,
      };

      return request(app.getHttpServer())
        .post('/mouse/move-human')
        .send(moveData)
        .expect(204)
        .then(() => {
          expect(nativeService.setMousePosition).toHaveBeenCalled();
        });
    });

    it('should return 400 for missing y', () => {
      const moveData = {
        x: 100,
      };

      return request(app.getHttpServer())
        .post('/mouse/move-human')
        .send(moveData)
        .expect(400)
        .expect((res: Response) => {
          expect(res.body).toHaveProperty('message');
          expect(Array.isArray(res.body.message)).toBe(true);
          expect(res.body.message[0]).toContain('y: Required');
        });
    });

    it('should return 400 for negative duration', () => {
      const moveData = {
        x: 100,
        y: 200,
        duration: -100
      };

      return request(app.getHttpServer())
        .post('/mouse/move-human')
        .send(moveData)
        .expect(400)
        .expect((res: Response) => {
          expect(res.body).toHaveProperty('message');
          expect(Array.isArray(res.body.message)).toBe(true);
          expect(res.body.message[0]).toContain('duration');
        });
    });
  });

  describe('POST /mouse/click', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should click mouse button', () => {
      const clickData = {
        button: 'RIGHT'
      };

      return request(app.getHttpServer())
        .post('/mouse/click')
        .send(clickData)
        .expect(204)
        .then(() => {
          expect(nativeService.setMouseButtonToState).toHaveBeenCalled();
        });
    });

    it('should return 400 for extra payload', () => {

      return request(app.getHttpServer())
        .post('/mouse/click')
        .send({a:3})
        .expect(400)
        .expect((res: Response) => {
          expect(res.body).toHaveProperty('message');
          expect(Array.isArray(res.body.message)).toBe(true);
          expect(res.body.message[0]).toContain('Unrecognized key(s)');
        });
    });

    it('should return 400 for invalid button', () => {
      const clickData = {
        button: 'INVALID',
        down: true
      };

      return request(app.getHttpServer())
        .post('/mouse/click')
        .send(clickData)
        .expect(400)
        .expect((res: Response) => {
          expect(res.body).toHaveProperty('message');
          expect(Array.isArray(res.body.message)).toBe(true);
          expect(res.body.message[0]).toContain('button');
        });
    });
  });
});
