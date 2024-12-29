import {Controller, Get, UseGuards} from '@nestjs/common';
import {RoleGuard} from '@/auth/roles.guard';

@Controller()
export class AppController {

  @Get('ping')
  @UseGuards(RoleGuard(['reader']))
  async ping(): Promise<string> {
    return "pong"
  }
}
