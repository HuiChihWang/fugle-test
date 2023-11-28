import { Module } from '@nestjs/common';
import { BitstampService } from './bitstamp.service';
import { SocketGateway } from './socket.gateway';
import { UtilsModule } from '../utils/utils.module';
import { SocketManager } from './socket-manager';

@Module({
  imports: [UtilsModule],
  providers: [SocketGateway, BitstampService, SocketManager],
  exports: [SocketGateway],
})
export class SocketModule {}
