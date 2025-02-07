import { Types } from "mongoose";
import { prop, getModelForClass, modelOptions } from "@typegoose/typegoose";

@modelOptions({
  schemaOptions: {
    timestamps: true,
    versionKey: false,
  },
})
class User {
  _id?: Types.ObjectId;

  @prop({ required: true })
  public fullName: string;

  @prop({ required: true, unique: true })
  public email: string;

  @prop({ required: true })
  public password: string;

  @prop({ required: true, default: false })
  public isVerified: boolean;

  @prop({ type: () => [Object], default: [] })
  public mxUsers: Array<{
    id: string;
    mxUserId: string;
    memberId?: string;
    email: string;
    isDisabled: boolean;
    metadata?: Record<string, any>;
    createdAt: Date;
  }>;
}

const UserModel = getModelForClass(User);

export { UserModel, User };
