import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { UserMessagesHelper } from '../helpers/messages.helper';

export class UpdateDto {
  @IsNotEmpty({ message: UserMessagesHelper.REGISTER_NAME_NOT_FOUND })
  @MinLength(2, { message: UserMessagesHelper.REGISTER_NAME_NOT_VALID })
  name: string;

  @IsString()
  avatar: string;
}
