import {
  IsArray,
  IsBoolean,
  IsString,
} from 'class-validator';

class LaunchExeRequest {
  @IsString()
  public path: string;

  @IsArray()
  @IsString({each: true})
  public arguments: string[];

  @IsBoolean()
  public waitTillFinish: boolean;
}

class KillExeRequest {
  @IsString()
  public name: string;
}

export {
  KillExeRequest,
  LaunchExeRequest,
};
