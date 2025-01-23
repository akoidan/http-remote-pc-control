import {ConfigService} from '@/config/config-service';
import path from 'path';


export function createConfigTyrsMock(logger: any) {
  return new ConfigService(
    path.resolve(__dirname, '..', '..', 'config', 'examples', 'config', 'tyrs.json'),
    path.resolve(__dirname, '..', '..', 'config', 'examples', 'macros.jsonc'),
    path.resolve(__dirname, '..', '..', 'config', 'examples', 'variables.jsonc'),
    logger,
    {}
  );
}

