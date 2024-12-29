import { possibleKeys } from 'src/event/event-nut-types';
import {
  IsIn,
  IsNumber,
  IsString
} from 'class-validator';

export class KeyPressRequest {
  @IsIn(possibleKeys)
  @IsString()
  key: string;
}

export class TypeTextRequest {
  @IsString()
  text: string;
}

export class MouseClickRequest {
  @IsNumber()
  x: number;
  @IsNumber()
  y: number;
}

export class LaunchExeRequest {
  @IsString()
  path: string;
}

export class KillExeRequest {
  @IsString()
  name: string;
}
