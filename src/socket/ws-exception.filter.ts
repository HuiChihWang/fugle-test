import { ArgumentsHost, Catch } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { WebSocket } from 'ws';

@Catch(WsException)
export class WsExceptionFilter {
  public catch(exception: WsException, host: ArgumentsHost) {
    const client = host.switchToWs().getClient() as WebSocket;
    client.send(
      JSON.stringify({
        event: 'error',
        data: exception.getError(),
      }),
    );
  }
}
