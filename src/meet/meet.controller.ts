import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Request,
} from '@nestjs/common';
import { MeetService } from './meet.service';
import { GetMeetDto } from './dtos/getMeet.dto';
import { CreateMeetDto } from './dtos/createMeet.dto';
import { UpdateMeetDto } from './dtos/updateMeet.dto';
import { GetMeetObjectDto } from './dtos/getMeetObject.dto';

@Controller('meet')
export class MeetController {
  constructor(private readonly meetService: MeetService) {}

  @Get()
  async getUserMeets(@Request() req) {
    const { userId } = req?.user;

    const result = await this.meetService.getMeetsByUser(userId);

    return result.map(
      (m) =>
        ({
          id: m._id.toString(),
          name: m.name,
          color: m.color,
          link: m.link,
        } as GetMeetDto),
    );
  }

  @Get(':id')
  async getMeetById(@Request() req, @Param() params) {
    const { userId } = req?.user;
    const { id } = params;

    return await this.meetService.getMeetById(id, userId);
  }

  @Post()
  async createMeet(@Request() req, @Body() dto: CreateMeetDto) {
    const { userId } = req?.user;
    await this.meetService.createMeet(userId, dto);
  }

  @Delete(':id')
  async deleteMeet(@Request() req, @Param() params) {
    const { userId } = req?.user;
    const { id } = params;

    await this.meetService.deleteMeetByUser(userId, id);
  }

  @Get('objects/:id')
  async getObjectsByMeetId(@Request() req, @Param() params) {
    const { userId } = req?.user;
    const { id } = params;
    const result = await this.meetService.getMeetObjects(id, userId);
    return result.map(
      (mObject) =>
        ({
          id: mObject._id.toString(),
          name: mObject.name,
          meet: mObject.meet.toString(),
          x: mObject.x,
          y: mObject.y,
          zIndex: mObject.zIndex,
          orientation: mObject.orientation,
        } as GetMeetObjectDto),
    );
  }

  @Put(':id')
  async updateMeet(
    @Request() req,
    @Param() params,
    @Body() dto: UpdateMeetDto,
  ) {
    const { userId } = req?.user;
    const { id } = params;
    await this.meetService.update(id, userId, dto);
  }
}
