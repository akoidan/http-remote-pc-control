import { possibleKeys } from 'src/event/event-nut-types';
import {
  IsIn,
  IsNumber,
  IsString
} from 'class-validator';

export class KeyPressEvent  {
  @IsIn(possibleKeys)
  @IsString()
  key: string;
}

export class TypeEvent  {
  @IsString()
  text: string;
}

export class MouseClickEvent  {
  @IsNumber()
  x: number;
  @IsNumber()
  y: number;
}

export class LaunchExeEvent  {
  @IsString()
  path: string;
}
