import { Module } from '@nestjs/common';
import { CoreModule } from './core/core.module';
import { SocketModule } from './socket/socket.module';

@Module({
  imports: [CoreModule, SocketModule],
})
export class AppModule {}
