import { Controller, Get, Request, BadRequestException } from '@nestjs/common';
import { UserService } from './user.service';
import { UserMessagesHelper } from './helpers/messages.helper';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async getUser(@Request() req) {
    const { userId } = req?.user;

    const result = await this.userService.getUserById(userId);

    if(!result) throw new BadRequestException(UserMessagesHelper.GET_USER_NOT_FOUND)

    return {
      name: result.name,
      email: result.email,
      avatar: result.avatar,
      id: result._id.toString(),
    };
  }
}
