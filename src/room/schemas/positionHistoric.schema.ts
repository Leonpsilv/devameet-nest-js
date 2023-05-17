import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { Meet } from 'src/meet/schemas/meet.schema';
import { User } from 'src/user/schemas/user.schema';

export type PositionHistoricDocument =
  mongoose.HydratedDocument<PositionHistoric>;

@Schema()
export class PositionHistoric {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: Meet.name })
  meet: Meet;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: User.name })
  user: User;

  @Prop({ required: true })
  x: number;

  @Prop({ required: true })
  y: number;

  @Prop({ required: true })
  orientation: string;

  @Prop({ default: false })
  muted: boolean;
}

export const PositionHistoricSchema =
  SchemaFactory.createForClass(PositionHistoric);
