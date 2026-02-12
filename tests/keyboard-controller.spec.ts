import {Test, TestingModule} from '@nestjs/testing';
import {INestApplication, Logger} from '@nestjs/common';
import request, {Response} from 'supertest';
import {KeyboardController} from '../src/keyboard/keyboard-controller';
import {KeyboardService} from '../src/keyboard/keyboard-service';
import {INativeModule, Native} from '../src/native/native-model';
import {OS_INJECT} from '../src/global/global-model';
import {RandomService} from '../src/random/random-service';
import {createMockNativeService, createMockRandomService, createMockLogger} from './test-utils';

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
