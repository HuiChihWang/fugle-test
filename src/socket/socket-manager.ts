import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { WebSocket as Socket } from 'ws';

@Injectable()
export class SocketManager {
  private static MAXIMUM_SOCKET_ID_GENERATION_ATTEMPTS = 10;
  private readonly mapClientSockets = new Map<string, Socket>();
  private readonly mapSocketClients = new Map<Socket, string>();

  registerSocket(socket: Socket) {
    if (!socket || this.mapSocketClients.has(socket)) {
      return;
    }

    const socketId = this.generateSocketId();
    if (!socketId) {
      socket.send('Cannot generate socket id, connect to server failed');
      socket.close();
      return;
    }

    this.mapClientSockets.set(socketId, socket);
    this.mapSocketClients.set(socket, socketId);
  }

  unregisterSocket(socket: Socket) {
    const socketId = this.getSocketId(socket);
    if (!socketId) {
      return;
    }

    this.mapClientSockets.delete(socketId);
    this.mapSocketClients.delete(socket);
  }

  getSocket(id: string) {
    return this.mapClientSockets.get(id);
  }

  getSocketId(socket: Socket) {
    return this.mapSocketClients.get(socket);
  }

  sendMessage<T>(socketId: string, event: string, payload: T) {
    const socket = this.getSocket(socketId);
    const wsPayload = {
      event,
      data: payload,
    };
    socket?.send(JSON.stringify(wsPayload));
  }

  private generateSocketId(): string {
    for (
      let i = 0;
      i < SocketManager.MAXIMUM_SOCKET_ID_GENERATION_ATTEMPTS;
      ++i
    ) {
      const generatedId = uuidv4();
      if (!this.mapClientSockets.has(generatedId)) {
        return generatedId;
      }
    }
    return null;
  }
}
