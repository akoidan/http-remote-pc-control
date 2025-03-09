import {
  Controller,
  Get,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('App')
@Controller()
export class AppController {
  @ApiOperation({summary: 'Pings this client to test whether it\'s working'})
  @Get('ping')
  ping(): string {
    return 'pong';
  }
}
