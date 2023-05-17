import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Meet, MeetDocument } from './schemas/meet.schema';
import { Model } from 'mongoose';
import { UserService } from 'src/user/user.service';
import { CreateMeetDto } from './dtos/createMeet.dto';
import { generateLink } from './helpers/linkGenerator.helper';
import { MeetObject, MeetObjectDocument } from './schemas/meetObject.schema';
import { MeetMessagesHelper } from './helpers/meetMessages.helper';
import { UpdateMeetDto } from './dtos/updateMeet.dto';
import {
  PositionHistoric,
  PositionHistoricDocument,
} from 'src/room/schemas/positionHistoric.schema';

@Injectable()
export class MeetService {
  private readonly logger = new Logger(MeetService.name);

  constructor(
    @InjectModel(Meet.name) private readonly model: Model<MeetDocument>,
    @InjectModel(MeetObject.name)
    private readonly objectModel: Model<MeetObjectDocument>,
    @InjectModel(PositionHistoric.name)
    private readonly positionHistoricModel: Model<PositionHistoricDocument>,
    private readonly userService: UserService,
  ) {}

  async getMeetsByUser(userId: string) {
    this.logger.debug('getMeetsByUser - ' + userId);
    return await this.model.find({ user: userId });
  }

  async createMeet(userId: string, dto: CreateMeetDto) {
    this.logger.debug('createMeet - ' + userId);

    const user = await this.userService.getUserById(userId);
    const meet = {
      ...dto,
      user,
      link: generateLink(),
    };

    const createdMeet = new this.model(meet);
    return await createdMeet.save();
  }

  async deleteMeetByUser(userId: string, meetId: string) {
    this.logger.debug(`deleteMeetByUser - ${userId} - ${meetId}`);
    await this.objectModel.deleteMany({ meet: meetId });
    await this.positionHistoricModel.deleteMany({ meet: meetId });
    return await this.model.deleteOne({ user: userId, _id: meetId });
  }

  async getMeetObjects(meetId: string, userId: string) {
    this.logger.debug(`getMeetObjects - ${userId} - ${meetId}`);
    const user = await this.userService.getUserById(userId);
    const meet = await this.model.findOne({ user, _id: meetId });

    return await this.objectModel.find({ meet });
  }

  async getMeetById(meetId: string, userId: string) {
    const user = await this.userService.getUserById(userId);
    return await this.model.findOne({ user, _id: meetId });
  }

  async update(meetId: string, userId: string, dto: UpdateMeetDto) {
    this.logger.debug(`update - ${userId} - ${meetId}`);
    const user = await this.userService.getUserById(userId);
    const meet = await this.model.findOne({ user, _id: meetId });

    if (!meet) {
      throw new BadRequestException(MeetMessagesHelper.UPDATE_MEET_NOT_FOUND);
    }

    meet.name = dto.name;
    meet.color = dto.color;
    await this.model.findByIdAndUpdate({ _id: meetId }, meet);

    await this.objectModel.deleteMany({ meet });
    await this.positionHistoricModel.deleteMany({ meet });

    let objectPayload: any;

    for (const object of dto.objects) {
      objectPayload = {
        meet,
        ...object,
      };

      await this.objectModel.create(objectPayload);
    }
  }
}
