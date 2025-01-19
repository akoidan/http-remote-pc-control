import {Module} from '@nestjs/common';
import {ExecutionService} from '@/execution/execution.service';
import {ExecutionController} from '@/execution/execution-controller';
import {WindowsService} from '@/execution/windows-service';

@Module({
  controllers: [ExecutionController],
  providers: [ExecutionService, WindowsService],
})
export class ExecutionModule {
}
