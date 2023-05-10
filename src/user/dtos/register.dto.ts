import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { UserMessagesHelper } from '../helpers/userMessages.helper';

export class RegisterDto {
  @MinLength(2, { message: UserMessagesHelper.REGISTER_NAME_NOT_FOUND })
  name: string;

  @IsEmail({}, { message: UserMessagesHelper.REGISTER_EMAIL_NOT_VALID })
  email: string;

  @IsNotEmpty({ message: UserMessagesHelper.AUTH_PASSWORD_NOT_FOUND })
  @MinLength(4, { message: UserMessagesHelper.REGISTER_STRONG_PASSWORD })
  @MaxLength(20, { message: UserMessagesHelper.REGISTER_STRONG_PASSWORD })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: UserMessagesHelper.REGISTER_STRONG_PASSWORD,
  })
  password: string;

  @IsString()
  avatar: string;
}
