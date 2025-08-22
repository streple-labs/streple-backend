import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable } from '@nestjs/common';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*', // TODO add only supported domain
  },
})
export class WebSocketService
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  broadcast(event: string, data: any) {
    this.server.emit(event, data);
  }

  async handleJoinRoom(client: Socket, roomId: string) {
    await client.join(roomId);
  }

  handleGroupBroadcast(event: string, roomId: string, data: any) {
    this.server.to(roomId).emit(event, data);
  }

  handlePrivateBroadcast(client: Socket, event: string, data: any) {
    this.server.to(client.id).emit(event, data);
  }
}
