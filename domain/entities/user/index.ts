import { Types } from "mongoose";
import { prop, getModelForClass, modelOptions } from "@typegoose/typegoose";

enum VerificationMethod {
  EMAIL = "EMAIL",
  PHONE = "PHONE_NUMBER",
}

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

  @prop({ required: true, unique: true })
  public phoneNumber: string;

  @prop({ required: true })
  public password: string;

  @prop({ required: true, default: false })
  public isVerified: boolean; /**Phone number or email verification will determine this */

  @prop({ required: false, enum: VerificationMethod, select: false })
  public verificationMethod: VerificationMethod;

  @prop({ required: false, default: false })
  public isEmailVerified: boolean;

  @prop({ required: false, default: false })
  public isPhoneVerified: boolean;

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
