import {ConfigService} from '@/config/config-service';
import path from 'path';
import type {Logger} from '@nestjs/common';


export function createConfigTyrsMock(logger: Logger): ConfigService {
  return new ConfigService(
    path.resolve(__dirname, '..', '..', 'config', 'examples', 'config', 'tyrs.json'),
    path.resolve(__dirname, '..', '..', 'config', 'examples', 'macros.jsonc'),
    path.resolve(__dirname, '..', '..', 'config', 'examples', 'variables.jsonc'),
    logger,
    {}
  );
}

