import mongoose, { Document, Model } from "mongoose";
import bcrypt from 'bcrypt';
import AuthService from "@src/services/auth";

export interface IUser {
    _id?: string,
    name: string,
    email: string,
    password: string
}

export enum CUSTOM_VALIDATION {
  DUPLICATED = 'DUPLICATED',
}

interface IUserModel extends Omit<IUser, '_id'>, Document {}

const schema = new mongoose.Schema(
    {
      name: { type: String, required: true },
      email: {
        type: String,
        required: true,
        unique: true,
      },
      password: { type: String, required: true },
    },
    {
      toJSON: {
        transform: (_, ret): void => {
          ret.id = ret._id;
          delete ret._id;
          delete ret.__v;
        },
      },
    }
);




schema.pre<IUserModel>('save', async function():Promise<void> {
  if(!this.password || !this.isModified('password')) {
    return;
  }
  try{
    const hashedPassword = await AuthService.hashPassword(this.password);
    this.password = hashedPassword;
  }catch(error){
    console.error(`Error hashing password for user ${this.name}`)
  }
})

schema.path('email').validate(async(email:string) => {
  const emailCount = await mongoose.models.User.countDocuments({email});
  return !emailCount;
}, 'already exists in the database.', CUSTOM_VALIDATION.DUPLICATED);


export const User: Model<IUserModel> = mongoose.model<IUserModel>('User', schema);
