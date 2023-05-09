import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { LoginDto } from './dtos/login.dto';
import { MessagesHelper } from './helpers/messages.helper';
import { RegisterDto } from 'src/user/dtos/register.dto';
import { UserService } from 'src/user/user.service';
import { UserMessagesHelper } from 'src/user/helpers/messages.helper';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  private logger = new Logger(AuthService.name);

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    this.logger.debug('login - started');
    const user = await this.userService.getUserByLoginAndPassword(
      dto.login,
      dto.password,
    );

    if (user == null) {
      throw new BadRequestException(
        MessagesHelper.AUTH_PASSWORD_OR_EMAIL_NOT_FOUND,
      );
    }

    const payload = { email: user.email, sub: user._id };
    return {
      email: user.email,
      name: user.name,
      token: this.jwtService.sign(payload, {
        secret: process.env.JWT_SECRET_KEY,
      }),
    };
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
