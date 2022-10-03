import { Module } from '@nestjs/common';
import { DevicedataService } from './devicedata.service';
import { DevicedataController } from './devicedata.controller';

@Module({
  controllers: [DevicedataController],
  providers: [DevicedataService]
})
export class DevicedataModule {}
