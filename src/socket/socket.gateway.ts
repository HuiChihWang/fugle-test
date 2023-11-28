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
import { SubscribePriceMessage, TradeDataToUser } from './socket.dto';
import { Logger, UseFilters, UsePipes } from '@nestjs/common';
import { WsValidationPipe } from './ws-validation.pipe';
import { WsExceptionFilter } from './ws-exception.filter';
import { Server, WebSocket as Socket } from 'ws';
import { SocketManager } from './socket-manager';

@UseFilters(WsExceptionFilter)
@UsePipes(WsValidationPipe)
@WebSocketGateway({ path: '/streaming' })
export class SocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private readonly maxCurrencyPairs = 10;

  constructor(
    private readonly socketManager: SocketManager,
    private readonly bitstampService: BitstampService,
  ) {}

  afterInit() {
    this.bitstampService.setFallback((id, error) => {
      const socket = this.socketManager.getSocket(id);
      if (!socket) {
        return;
      }
      this.socketManager.sendMessage<string>(id, 'error', error.toString());
    });
    this.bitstampService.setCallback(
      ({ currencyPair, data, subscriptions }) => {
        Logger.log(
          `publish trade data ${currencyPair}: ${JSON.stringify(data)}`,
        );
        subscriptions.forEach((subscription) => {
          this.socketManager.sendMessage<TradeDataToUser>(
            subscription,
            'trade',
            data,
          );
        });
      },
    );
  }

  handleConnection(@ConnectedSocket() socket: Socket) {
    this.socketManager.registerSocket(socket);
    const socketId = this.socketManager.getSocketId(socket);
    Logger.log(`client ${socketId} connect to web socket.`);
  }

  handleDisconnect(@ConnectedSocket() socket: Socket) {
    const socketId = this.socketManager.getSocketId(socket);
    this.bitstampService.unregisterAll(socketId);
    this.socketManager.unregisterSocket(socket);
    Logger.log(`client ${socketId} disconnect from web socket.`);
  }

  @SubscribeMessage('subscribe')
  subscribe(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: SubscribePriceMessage,
  ) {
    const socketId = this.socketManager.getSocketId(socket);
    const { currencyPairs = [] } = payload;
    const currentSubscriptions =
      this.bitstampService.getSubscriptions(socketId);
    const totalSubscriptions = new Set([
      ...currentSubscriptions,
      ...currencyPairs,
    ]);

    if (totalSubscriptions.size > this.maxCurrencyPairs) {
      throw new WsException(`max currency pairs is ${this.maxCurrencyPairs}`);
    }

    currencyPairs.forEach((currencyPair) => {
      this.bitstampService.subscribe(socketId, currencyPair);
    });
  }

  @SubscribeMessage('unsubscribe')
  unsubscribe(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: SubscribePriceMessage,
  ) {
    const socketId = this.socketManager.getSocketId(socket);
    const { currencyPairs = [] } = payload;
    currencyPairs.forEach((currencyPair) => {
      this.bitstampService.unsubscribe(socketId, currencyPair);
    });
  }
}
