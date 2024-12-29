import {IsString} from 'class-validator';

export class LaunchExeRequest {
  @IsString()
  path: string;
}

export class KillExeRequest {
  @IsString()
  name: string;
}
