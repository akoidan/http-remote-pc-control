import {Test, TestingModule} from '@nestjs/testing';
import {INestApplication, Logger} from '@nestjs/common';
import request, {Response} from 'supertest';
import {KeyboardController} from '../src/keyboard/keyboard-controller';
import {KeyboardService} from '../src/keyboard/keyboard-service';
import {INativeModule, Native} from '../src/native/native-model';
import {OS_INJECT} from '../src/global/global-model';
import {RandomService} from '../src/random/random-service';
import {createMockNativeService, createMockRandomService, createMockLogger, setupValidationPipe} from './test-utils';
import {KeyPressRequestDto} from "../src/keyboard/keyboard-dto";

describe('KeyboardController (e2e)', () => {
  let app: INestApplication;
  let nativeService: jest.Mocked<INativeModule>;

  beforeAll(async () => {
    const mockNativeService = createMockNativeService();
    const mockRandomService = createMockRandomService();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [KeyboardController],
      providers: [
        KeyboardService,
        {provide: Native, useValue: mockNativeService},
        {provide: OS_INJECT, useValue: 'linux'},
        {provide: Logger, useValue: createMockLogger()},
        {provide: RandomService, useValue: mockRandomService},
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

  describe('POST /keyboard/key-press', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should call keyTap with correct parameters', () => {
      const keyPressData: KeyPressRequestDto = {
        keys: ['a', 'b', 'c'],
        holdKeys: ['control']
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
      const keyPressData: KeyPressRequestDto = {
        keys: ['enter'],
        holdKeys: []
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

    it('should return 400 for missing keys field', () => {
      const keyPressData = {
        modifiers: []
      };

      return request(app.getHttpServer())
        .post('/keyboard/key-press')
        .send(keyPressData)
        .expect(400)
        .expect((res: Response) => {
          expect(res.body).toHaveProperty('message');
          expect(Array.isArray(res.body.message)).toBe(true);
          expect(res.body.message[0]).toContain('keys');
        });
    });

    it('should return 400 for invalid key', () => {
      const keyPressData = {
        keys: ['invalid_key_123'],
        modifiers: []
      };

      return request(app.getHttpServer())
        .post('/keyboard/key-press')
        .send(keyPressData)
        .expect(400)
        .expect((res: Response) => {
          expect(res.body).toHaveProperty('message');
          expect(Array.isArray(res.body.message)).toBe(true);
          expect(res.body.message[0]).toContain('Invalid');
        });
    });

    it('should return 400 for empty keys array', () => {
      const keyPressData = {
        keys: [],
        modifiers: []
      };

      return request(app.getHttpServer())
        .post('/keyboard/key-press')
        .send(keyPressData)
        .expect(400)
        .expect((res: Response) => {
          expect(res.body).toHaveProperty('message');
          expect(Array.isArray(res.body.message)).toBe(true);
          expect(res.body.message[0]).toContain('keys');
        });
    });

    it('should return 400 for invalid duration', () => {
      const keyPressData = {
        keys: ['a'],
        modifiers: [],
        duration: 10 // Below minimum of 50
      };

      return request(app.getHttpServer())
        .post('/keyboard/key-press')
        .send(keyPressData)
        .expect(400)
        .expect((res: Response) => {
          expect(res.body).toHaveProperty('message');
          expect(Array.isArray(res.body.message)).toBe(true);
          expect(res.body.message[0]).toContain('duration');
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

    it('should return 400 for missing text field', () => {
      const typeTextData = {};

      return request(app.getHttpServer())
        .post('/keyboard/type-text')
        .send(typeTextData)
        .expect(400)
        .expect((res: Response) => {
          expect(res.body).toHaveProperty('message');
          expect(Array.isArray(res.body.message)).toBe(true);
          expect(res.body.message[0]).toContain('text');
        });
    });

    it('should return 400 for non-string text', () => {
      const typeTextData = {
        text: 123
      };

      return request(app.getHttpServer())
        .post('/keyboard/type-text')
        .send(typeTextData)
        .expect(400)
        .expect((res: Response) => {
          expect(res.body).toHaveProperty('message');
          expect(Array.isArray(res.body.message)).toBe(true);
          expect(res.body.message[0]).toContain('text');
        });
    });

    it('should return 400 for non-integer keyDelay', () => {
      const typeTextData = {
        text: 'Hello',
        keyDelay: 'invalid' // Non-integer value
      };

      return request(app.getHttpServer())
        .post('/keyboard/type-text')
        .send(typeTextData)
        .expect(400)
        .expect((res: Response) => {
          expect(res.body).toHaveProperty('message');
          expect(Array.isArray(res.body.message)).toBe(true);
          expect(res.body.message[0]).toContain('keyDelay');
        });
    });

    it('should return 400 for invalid keyDelayDeviation', () => {
      const typeTextData = {
        text: 'Hello',
        keyDelayDeviation: 2 // Above maximum of 1
      };

      return request(app.getHttpServer())
        .post('/keyboard/type-text')
        .send(typeTextData)
        .expect(400)
        .expect((res: Response) => {
          expect(res.body).toHaveProperty('message');
          expect(Array.isArray(res.body.message)).toBe(true);
          expect(res.body.message[0]).toContain('keyDelayDeviation');
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

    it('should return 400 for invalid keyboard layout', () => {
      const layoutData = {
        layout: 'asdfasdf'
      };

      return request(app.getHttpServer())
        .post('/keyboard/set-layout')
        .send(layoutData)
        .expect(400)
        .expect((res: Response) => {
          expect(res.body).toHaveProperty('message');
          expect(Array.isArray(res.body.message)).toBe(true);
          expect(res.body.message[0]).toContain('Invalid');
        });
    });

    it('should return 400 for missing layout field', () => {
      const layoutData = {};

      return request(app.getHttpServer())
        .post('/keyboard/set-layout')
        .send(layoutData)
        .expect(400)
        .expect((res: Response) => {
          expect(res.body).toHaveProperty('message');
          expect(Array.isArray(res.body.message)).toBe(true);
          expect(res.body.message[0]).toContain('layout');
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
