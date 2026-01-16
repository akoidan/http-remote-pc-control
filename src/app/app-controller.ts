import {Controller, Get} from '@nestjs/common';
import {ApiOperation, ApiResponse, ApiTags} from '@nestjs/swagger';
import {PingResponse, PingResponseDto} from '@/app/app-dto';
// should be require, otherwise nest build will generate src dir inside dist
// npm "pkg" resolves it properly
// eslint-disable-next-line
const packageJson = require('../../package.json');

@ApiTags('App')
@Controller('app')
export class AppController {
  @ApiOperation({summary: 'Pings this client to test whether it\'s working'})
  @Get('ping')
  @ApiResponse({type: PingResponseDto})
  ping(): PingResponse {
    return {status: 'ok', version: packageJson.version};
  }
}
