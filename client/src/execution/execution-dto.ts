import {
  IsArray,
  IsString,
} from 'class-validator';

class LaunchExeRequest {
  @IsString()
  public path: string;

  @IsArray()
  @IsString({each: true})
  public arguments: string[];
}

class KillExeRequest {
  @IsString()
  public name: string;
}

export {
  KillExeRequest,
  LaunchExeRequest,
};
