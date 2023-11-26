import { Module } from '@nestjs/common';
import { BitstampService } from './bitstamp.service';
import { SocketGateway } from './socket.gateway';
import { UtilsModule } from '../utils/utils.module';

@Module({
  imports: [UtilsModule],
  providers: [SocketGateway, BitstampService],
  exports: [SocketGateway],
})
export class SocketModule {}
