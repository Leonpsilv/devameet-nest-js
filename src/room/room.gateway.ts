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
import { UpdatePositionHistoricDto } from './dtos/updatePositionHistoric.dto';

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
      (socket) => socket.id === client.id,
    );

    if (!existingOnSocket) return;

    this.activeSockets = this.activeSockets.filter(
      (socket) => socket.id !== client.id,
    );

    const userInRoom = await this.roomService.getUsersInRoom(client.id);

    const positionHistoric = {
      meet: userInRoom.meet.toString(),
      user: userInRoom.user.toString(),
      x: userInRoom.x,
      y: userInRoom.y,
      orientation: userInRoom.orientation,
      muted: userInRoom.muted,
    } as UpdatePositionHistoricDto;

    await this.roomService.updateUserPositionHistoric(positionHistoric);
    await this.roomService.deleteUsersPosition(client.id);
    client.broadcast.emit(`${existingOnSocket.room}-remove-user`, {
      socketId: client.id,
    });

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

      const usersPositions = await this.roomService.getUsersPosition({
        link,
        userId,
      });

      function getUsedPosition(array: any[], key: string) {
        const allPositions = array.map((p) => p[key]);
        return allPositions;
      }

      const usedPostitions = {
        x: getUsedPosition(usersPositions, 'x'),
        y: getUsedPosition(usersPositions, 'y'),
      };

      function mergeArrays(array1: any[], array2: any[]) {
        const result = [];
        if (array1.length === array2.length) {
          for (let index = 0; index < array1.length; index++) {
            const array = [];
            array.push(array1[index]);
            array.push(array2[index]);
            result.push(array);
          }
        }
        return result;
      }

      const usedPostitionsInArray = mergeArrays(
        usedPostitions.x,
        usedPostitions.y,
      );

      function testSlot(slot: { x: number; y: number }): boolean {
        for (let index = 0; index < usedPostitionsInArray.length; index++) {
          const t = usedPostitionsInArray[index];
          if (slot.x === t[0] && slot.y === t[1]) return false;
        }
        return true;
      }

      function getFreePositions() {
        const options = [2, 3, 4, 5, 6, 7, 8, 1, 0];
        const slot = {
          x: options[0],
          y: options[0],
        };
        for (let indexY = 0; indexY < options.length; indexY++) {
          slot.y = options[indexY];
          for (let indexX = 0; indexX < options.length; indexX++) {
            slot.x = options[indexX];
            if (
              (usedPostitions.x[indexX] === slot.x && usedPostitions.y[indexX] !== slot.y) ||
              (usedPostitions.y[indexX] === slot.y && usedPostitions.x[indexX] !== slot.x) ||
              (usedPostitions.y[indexX] !== slot.y && usedPostitions.x[indexX] !== slot.x)
            ) {
              if (testSlot(slot)) return slot;
            }
          }
        }
      }

      let freeSlot = getFreePositions();
      const meet = await this.roomService._getMeet(link)
      const userPositionHistoric = await this.roomService.getUserPositionHistoric(userId, meet._id.toString());
      if (userPositionHistoric) {
        const slotHistoric = {
          x: userPositionHistoric.x,
          y: userPositionHistoric.y,
        };
        if (testSlot(slotHistoric)) {
          freeSlot = slotHistoric
        }
      }

      const dto = {
        link,
        userId,
        x: freeSlot.x,
        y: freeSlot.y,
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

  @SubscribeMessage('call-user')
  async callUser(client: Socket, data: any) {
    this.logger.debug(`callUser: ${client.id} to: ${data.to}`);
    client.to(data.to).emit('call-made', {
      offer: data.offer,
      socket: client.id,
    });
  }

  @SubscribeMessage('make-answer')
  async makeAnswer(client: Socket, data: any) {
    this.logger.debug(`makeAnswer: ${client.id} to: ${data.to}`);
    client.to(data.to).emit('answer-made', {
      answer: data.answer,
      socket: client.id,
    });
  }
}
