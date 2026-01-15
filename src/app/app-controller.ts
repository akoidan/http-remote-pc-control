import {Controller, Get} from '@nestjs/common';
import {ApiOperation, ApiResponse, ApiTags} from '@nestjs/swagger';
import {PingResponse, PingResponseDto} from '@/app/app-dto';

@ApiTags('App')
@Controller('app')
export class AppController {
  @ApiOperation({summary: 'Pings this client to test whether it\'s working'})
  @Get('ping')
  @ApiResponse({type: PingResponseDto})
  ping(): PingResponse {
    return { value: 'pong' };
  }
}
