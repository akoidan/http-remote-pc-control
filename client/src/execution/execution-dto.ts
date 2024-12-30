import {IsString} from 'class-validator';

class LaunchExeRequest {
  @IsString()
  public path: string;
}

class KillExeRequest {
  @IsString()
  public name: string;
}

export {KillExeRequest, LaunchExeRequest};
