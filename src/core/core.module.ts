import { Module } from '@nestjs/common';
import { CoreService } from './core.service';
import { HttpModule } from '@nestjs/axios';
import { APIService } from './api.service';
import { CoreController } from './core.controller';

@Module({
  imports: [HttpModule],
  providers: [CoreService, APIService],
  controllers: [CoreController],
})
export class CoreModule {}
