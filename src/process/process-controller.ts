import {Body, Controller, Get, Param, ParseIntPipe, Post} from '@nestjs/common';
import {ApiOperation, ApiResponse, ApiTags} from '@nestjs/swagger';
import {ProcessService} from '@/process/process-service';
import {CreateProcessRequestDto} from '@/window/window-dto';
import {
  ProcessIdResponse,
  ProcessIdResponseDto,
  WindowHandleResponse,
  WindowHandleResponseDto,
} from '@/process/process-dto';

@ApiTags('Process')
@Controller('process')
export class ProcessController {
  constructor(private readonly processService: ProcessService) {}

  @Post('create')
  @ApiOperation({summary: 'Create process'})
  @ApiResponse({type: ProcessIdResponseDto})
  createProcess(@Body() body: CreateProcessRequestDto): ProcessIdResponse {
    return {pid: this.processService.createProcess(body.path, body.cmd)};
  }

  @Get(':pid/main-window')
  @ApiOperation({summary: 'Get process\' main window'})
  @ApiResponse({type: WindowHandleResponseDto})
  getProcessMainWindow(@Param('pid', ParseIntPipe) pid: number): WindowHandleResponse {
    return {wid: this.processService.getProcessMainWindow(pid)};
  }
}
