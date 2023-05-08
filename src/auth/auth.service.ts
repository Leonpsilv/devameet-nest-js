import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { LoginDto } from './dtos/login.dto';
import { MessagesHelper } from './helpers/messages.helper';
import { RegisterDto } from 'src/user/dtos/register.dto';
import { UserService } from 'src/user/services/user.service';
import { UserMessagesHelper } from 'src/user/helpers/messages.helper';

@Injectable()
export class AuthService {
  private logger = new Logger(AuthService.name);

  constructor(private readonly userService: UserService) {}

  login(dto: LoginDto) {
    this.logger.debug('login - started');
    if (dto.login !== 'teste@teste.com' || dto.password !== 'senha123') {
      throw new BadRequestException(
        MessagesHelper.AUTH_PASSWORD_OR_EMAIL_NOT_FOUND,
      );
    }

    return dto;
  }

  async register(dto: RegisterDto) {
    this.logger.debug('register - started');

    if (await this.userService.existsByEmail(dto.email)) {
      this.logger.debug(`register - same email found for: ${dto.email}`);
      throw new BadRequestException(UserMessagesHelper.REGISTER_EMAIL_FOUND);
    }

    const user = await this.userService.create(dto);

    return user;
  }
}
