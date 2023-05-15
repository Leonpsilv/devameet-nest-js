import { IsBoolean } from "class-validator";
import { JoinRoomDto } from "./joinroom.dto";
import { RoomMessagesHelper } from "../helpers/rommMessages.helper";

export class ToggleMuteDto extends JoinRoomDto{   

    @IsBoolean({message: RoomMessagesHelper.MUTE_NOT_VALID})
    muted: boolean;
}