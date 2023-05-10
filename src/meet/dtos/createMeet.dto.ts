import { Matches, MinLength } from 'class-validator';
import { meetMessagesHelper } from '../helpers/meetMessages.helper';

export class CreateMeetDto {
  @MinLength(2, { message: meetMessagesHelper.CREATE_NAME_NOT_VALID })
  name: string;

  @Matches(/[0-9A-Fa-f]{3,6}/, {
    message: meetMessagesHelper.CREATE_COLOR_NOT_VALID,
  })
  color: string;
}
