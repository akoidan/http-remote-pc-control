import {Module} from '@nestjs/common';
import {ExecutionService} from '@/execution/execution.service';
import {ExecutionController} from '@/execution/execution-controller';
import {CustomLoggerModule} from '@/logger/custom-logger-module';

@Module({
  imports: [CustomLoggerModule],
  controllers: [ExecutionController],
  providers: [ExecutionService],
})
export class ExecutionModule {
}
