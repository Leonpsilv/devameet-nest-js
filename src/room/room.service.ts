import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Meet, MeetDocument } from 'src/meet/schemas/meet.schema';
import {
  MeetObject,
  MeetObjectDocument,
} from 'src/meet/schemas/meetObject.schema';
import { Position, PositionDocument } from './schemas/position.schema';
import { Model } from 'mongoose';
import { UserService } from 'src/user/user.service';
import { RoomMessagesHelper } from './helpers/rommMessages.helper';
import { UpdatePositionDto } from './dtos/updatePosition.dto';
import { ToggleMuteDto } from './dtos/toggleMuted.dto';
import { JoinRoomDto } from './dtos/joinRoom.dto';

@Injectable()
export class RoomService {
  private logger = new Logger(RoomService.name);

  constructor(
    @InjectModel(Meet.name) private readonly meetModel: Model<MeetDocument>,
    @InjectModel(MeetObject.name)
    private readonly objectModel: Model<MeetObjectDocument>,
    @InjectModel(Position.name)
    private readonly positionModel: Model<PositionDocument>,
    private readonly userService: UserService,
  ) {}

  async _getMeet(link: string) {
    const meet = await this.meetModel.findOne({ link });
    if (!meet) {
      throw new BadRequestException(RoomMessagesHelper.JOIN_LINK_NOT_VALID);
    }

    return meet;
  }

  async getRoom(link: string) {
    this.logger.debug(`getRoom - ${link}`);

    const meet = await this._getMeet(link);
    const objects = await this.objectModel.find({ meet });

    return {
      link,
      name: meet.name,
      color: meet.color,
      objects,
    };
  }

  async listUsersPositionByLink(link: string) {
    this.logger.debug(`listUsersPositionByLink - ${link}`);

    const meet = await this._getMeet(link);
    return await this.positionModel.find({ meet });
  }

  async deleteUsersPosition(clientId: string) {
    this.logger.debug(`deleteUsersPosition - ${clientId}`);

    return await this.positionModel.deleteMany({ clientId });
  }

  async updateUserPosition(clientId: string, dto: UpdatePositionDto) {
    //this.logger.debug(`listUsersPositionByLink - ${dto.link}`);

    const meet = await this._getMeet(dto.link);
    const user = await this.userService.getUserById(dto.userId);

    if (!user) {
      throw new BadRequestException(RoomMessagesHelper.JOIN_USER_NOT_VALID);
    }

    const position = {
      ...dto,
      clientId,
      user,
      meet,
      name: user.name,
      avatar: user.avatar || 'avatar_01',
    };

    const usersInRoom = await this.positionModel.find({ meet });
    const loogedUserInRoom = usersInRoom.find(
      (u) =>
        u.user.toString() === user._id.toString() || u.clientId === clientId,
    );

    if (loogedUserInRoom) {
      await this.positionModel.findByIdAndUpdate(
        { _id: loogedUserInRoom._id },
        position,
      );
    } else {
      if (usersInRoom && usersInRoom.length > 10) {
        throw new BadRequestException(RoomMessagesHelper.ROOM_MAX_USERS);
      }

      await this.positionModel.create(position);
    }
  }

  async getUsersPosition(dto: JoinRoomDto) {
    const meet = await this._getMeet(dto.link);
    const user = await this.userService.getUserById(dto.userId);
    if (!user) {
      throw new BadRequestException(RoomMessagesHelper.JOIN_USER_NOT_VALID);
    }

    const usersInRoom = await this.positionModel.find({ meet });
    const positions = usersInRoom.map((user) => {
      return {
        x: user.x,
        y: user.y,
      };
    });

    return positions;
  }

  async updateUserMute(dto: ToggleMuteDto) {
    //this.logger.debug(`updateUserMute - ${dto.link} - ${dto.userId}`);

    const meet = await this._getMeet(dto.link);
    const user = await this.userService.getUserById(dto.userId);
    await this.positionModel.updateMany({ user, meet }, { muted: dto.muted });
  }
}
