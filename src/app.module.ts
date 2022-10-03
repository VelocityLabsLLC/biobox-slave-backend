import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DevicedataModule } from './devicedata/devicedata.module';
const dotenv = require('dotenv');
dotenv.config();
@Module({
  imports: [DevicedataModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
