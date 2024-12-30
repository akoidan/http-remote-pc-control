import {Module} from '@nestjs/common';
import {ExecutionService} from '@/execution/execution.service';
import {ExecutionController} from '@/execution/execution-controller';

@Module({
  controllers: [ExecutionController],
  providers: [ExecutionService],
})
export class ExecutionModule {
}
