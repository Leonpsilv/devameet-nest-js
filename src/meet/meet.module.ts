import { Module } from '@nestjs/common';
import { MeetController } from './meet.controller';
import { MeetService } from './meet.service';
import { UserModule } from 'src/user/user.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Meet, MeetSchema } from './schemas/meet.schema';
import { MeetObject, MeetObjectSchema } from './schemas/meetObject.schema';
import { PositionHistoric, PositionHistoricSchema } from 'src/room/schemas/positionHistoric.schema';

@Module({
  imports: [
    UserModule,
    MongooseModule.forFeature([
      { name: Meet.name, schema: MeetSchema },
      { name: MeetObject.name, schema: MeetObjectSchema },
      { name: PositionHistoric.name, schema: PositionHistoricSchema },
    ]),
  ],
  controllers: [MeetController],
  providers: [MeetService],
  exports: [MongooseModule, MeetService],
})
export class MeetModule {}
