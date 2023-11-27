import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { BitstampService } from './bitstamp.service';
import { SubscribePriceMessage } from './socket.dto';
import { Server, Socket } from 'socket.io';
import { Logger, UseFilters, UsePipes } from '@nestjs/common';
import { WsValidationPipe } from './ws-validation.pipe';
import { WsExceptionFilter } from './ws-exception.filter';

@UseFilters(WsExceptionFilter)
@UsePipes(WsValidationPipe)
@WebSocketGateway({ namespace: '/streaming' })
export class SocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private readonly mapClientSockets = new Map<string, Socket>();

  private readonly maxCurrencyPairs = 10;

  constructor(private readonly bitstampService: BitstampService) {}

  afterInit() {
    this.bitstampService.setCallback(
      ({ currencyPair, data, subscriptions }) => {
        Logger.log(
          `publish trade data ${currencyPair}: ${JSON.stringify(data)}`,
        );
        subscriptions.forEach((subscription) => {
          const socket = this.mapClientSockets.get(subscription);
          if (!socket) {
            return;
          }
          socket.emit('trade', data);
        });
      },
    );
  }

  handleConnection(@ConnectedSocket() socket: Socket) {
    this.mapClientSockets.set(socket.id, socket);
    Logger.log(`client ${socket.id} connect to web socket.`);
  }

  handleDisconnect(@ConnectedSocket() socket: Socket) {
    this.bitstampService.unregisterAll(socket.id);
    this.mapClientSockets.delete(socket.id);
    Logger.log(`client ${socket.id} disconnect from web socket.`);
  }

  @SubscribeMessage('subscribe')
  subscribe(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: SubscribePriceMessage,
  ) {
    const { currencyPairs = [] } = payload;
    const currentSubscriptions = this.bitstampService.getSubscriptions(
      socket.id,
    );
    const totalSubscriptions = new Set([
      ...currentSubscriptions,
      ...currencyPairs,
    ]);

    if (totalSubscriptions.size > this.maxCurrencyPairs) {
      throw new WsException(`max currency pairs is ${this.maxCurrencyPairs}`);
    }

    currencyPairs.forEach((currencyPair) => {
      this.bitstampService.subscribe(socket.id, currencyPair);
    });
  }

  @SubscribeMessage('unsubscribe')
  unsubscribe(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: SubscribePriceMessage,
  ) {
    const { currencyPairs = [] } = payload;
    currencyPairs.forEach((currencyPair) => {
      this.bitstampService.unsubscribe(socket.id, currencyPair);
    });
  }
}
