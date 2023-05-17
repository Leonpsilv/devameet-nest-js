import { IsBoolean, IsNotEmpty, IsNumber, IsString, Max, Min } from 'class-validator';
import { MeetMessagesHelper } from 'src/meet/helpers/meetMessages.helper';
import { RoomMessagesHelper } from '../helpers/rommMessages.helper';

export class UpdatePositionHistoricDto {
  @IsNotEmpty({message: RoomMessagesHelper.JOIN_USER_NOT_VALID})
  user: string;

  @IsNotEmpty({message: MeetMessagesHelper.UPDATE_MEET_NOT_FOUND})
  meet: string;

  @IsBoolean({message: RoomMessagesHelper.MUTE_NOT_VALID})
  muted: boolean;

  @IsNumber({}, { message: MeetMessagesHelper.UPDATE_XY_NOT_VALID })
  @Min(0, { message: MeetMessagesHelper.UPDATE_XY_NOT_VALID })
  @Max(8, { message: MeetMessagesHelper.UPDATE_XY_NOT_VALID })
  x: number;

  @IsNumber({}, { message: MeetMessagesHelper.UPDATE_XY_NOT_VALID })
  @Min(0, { message: MeetMessagesHelper.UPDATE_XY_NOT_VALID })
  @Max(8, { message: MeetMessagesHelper.UPDATE_XY_NOT_VALID })
  y: number;

  @IsString({ message: MeetMessagesHelper.UPDATE_ORIENTATION_NOT_VALID })
  orientation: string;
}
