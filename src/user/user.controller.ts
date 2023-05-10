import {
  Controller,
  Get,
  Request,
  BadRequestException,
  Put,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UserMessagesHelper } from './helpers/messages.helper';
import { UpdateDto } from './dtos/update.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async getUser(@Request() req) {
    const { userId } = req?.user;

    const result = await this.userService.getUserById(userId);

    if (!result)
      throw new BadRequestException(UserMessagesHelper.GET_USER_NOT_FOUND);

    return {
      name: result.name,
      email: result.email,
      avatar: result.avatar,
      id: result._id.toString(),
    };
  }

  @Put()
  @HttpCode(HttpStatus.OK)
  async updateUser(@Request() req, @Body() dto: UpdateDto) {
    const { userId } = req?.user;
    const updatedUser = await this.userService.updateUser(userId, dto);
  }
}
