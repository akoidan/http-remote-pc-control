import {Body, Controller, Get, Param, ParseIntPipe, Post} from '@nestjs/common';
import {ApiOperation, ApiTags} from '@nestjs/swagger';
import {ProcessService} from '@/process/process-service';
import {CreateProcessRequestDto} from '@/window/window-dto';

@ApiTags('Process')
@Controller('process')
export class ProcessController {
  constructor(private readonly processService: ProcessService) {}

  @Post('create')
  @ApiOperation({summary: 'Create process'})
  async createProcess(@Body() body: CreateProcessRequestDto): Promise<number> {
    return this.processService.createProcess(body.path, body.cmd);
  }

  @Get(':pid/main-window')
  @ApiOperation({summary: "Get process' main window"})
  async getProcessMainWindow(@Param('pid', ParseIntPipe) pid: number): Promise<number> {
    return this.processService.getProcessMainWindow(pid);
  }
}
