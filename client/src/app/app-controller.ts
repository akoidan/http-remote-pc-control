import {Controller, Get, UseGuards} from '@nestjs/common';
import {RoleGuard} from '@/auth/roles.guard';

@UseGuards(RoleGuard(['reader']))
@Controller()
export class AppController {
  @Get('ping')
  ping(): string {
    return 'pong';
  }
}
