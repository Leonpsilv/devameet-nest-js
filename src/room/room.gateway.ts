import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { RoomService } from './room.service';
import { Server, Socket } from 'socket.io';
import { JoinRoomDto } from './dtos/joinRoom.dto';
import { UpdatePositionDto } from './dtos/updatePosition.dto';
import { ToggleMuteDto } from './dtos/toggleMuted.dto';

type ActiveSocketType = {
  room: String;
  id: string;
  userId: string;
};

@WebSocketGateway({ cors: true })
export class RoomGateway implements OnGatewayInit, OnGatewayDisconnect {
  constructor(private readonly roomService: RoomService) {}

  @WebSocketServer() wss: Server;

  private logger = new Logger(RoomGateway.name);
  private activeSockets: ActiveSocketType[] = [];

  afterInit(server: any) {
    this.logger.log('gateway initialized');
  }

  async handleDisconnect(client: any) {
    const existingOnSocket = this.activeSockets.find(
      socket => socket.id === client.id
    );

    if (!existingOnSocket) return;

    this.activeSockets = this.activeSockets.filter(
      socket => socket.id !== client.id
    );

    await this.roomService.deleteUsersPosition(client.id);
    client.broadcast.emit(`${existingOnSocket.room}-remove-user`, { socketId: client.id });

    this.logger.debug(`Client: ${client.id} disconnected`);
  }

  @SubscribeMessage('join')
  async handleJoin(client: Socket, payload: JoinRoomDto) {
    const { link, userId } = payload;
    const existingOnSocket = this.activeSockets.find(
      (socket) => socket.room === link && socket.id === client.id,
    );

    if (!existingOnSocket) {
      this.activeSockets.push({ room: link, id: client.id, userId });

      const dto = {
        link,
        userId,
        x: 2,
        y: 2,
        orientation: 'down',
      } as UpdatePositionDto;

      await this.roomService.updateUserPosition(client.id, dto);
    }

    const users = await this.roomService.listUsersPositionByLink(link);
    this.wss.emit(`${link}-update-user-list`, { users });

    if (!existingOnSocket) {
      client.broadcast.emit(`${link}-add-user`, { user: client.id });
    }

    this.logger.debug(`Socket client: ${client.id} start to join room ${link}`);
  }

  @SubscribeMessage('move')
  async handleMove(client: Socket, payload: UpdatePositionDto) {
    const { link, userId, x, y, orientation } = payload;
    const dto = {
      link,
      userId,
      x,
      y,
      orientation,
    } as UpdatePositionDto;

    await this.roomService.updateUserPosition(client.id, dto);
    const users = await this.roomService.listUsersPositionByLink(link);
    this.wss.emit(`${link}-update-user-list`, { users });
  }

  @SubscribeMessage('toggle-mute-user')
  async handleToggleMute(_: Socket, payload: ToggleMuteDto) {
    const { link } = payload;
    await this.roomService.updateUserMute(payload);
    const users = await this.roomService.listUsersPositionByLink(link);
    this.wss.emit(`${link}-update-user-list`, { users });
  }
}
