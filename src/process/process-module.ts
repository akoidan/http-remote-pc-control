import {Logger, Module} from '@nestjs/common';
import {ProcessController} from '@/process/process-controller';
import {ProcessService} from '@/process/process-service';

@Module({
  controllers: [ProcessController],
  providers: [Logger, ProcessService],
})
export class ProcessModule {}
