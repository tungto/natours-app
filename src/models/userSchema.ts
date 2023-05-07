import mongoose, { Model } from 'mongoose';
import bcrypt from 'bcrypt';

export interface IUser {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role?: string;
  active?: boolean;
  photo?: string;
  passwordChangedAt: number;
}

export interface IUserDocument extends IUser, mongoose.Document {
  setPassword: (password: string) => Promise<void>;
  checkPassword: (inputPw: string, userPw: string) => Promise<boolean>;
  changedPasswordAfter: (timestamp: number) => boolean;
}

interface IUserModel extends Model<IUserDocument> {
  findByUsername: (username: string) => Promise<IUserDocument>;
}

export const UserSchema = new mongoose.Schema<IUserDocument, Model<IUserDocument>>({
  name: {
    type: String,
    required: true,
  },

  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true,
    // There are two ways for an promise-based async validator to fail:
    // 1. If the promise rejected => failed with given error
    // 2. If the promise resolved to false => Mongoose create an error
    // validate: [isEmail, 'Please provide a valid email'],
  },

  role: {
    type: String,
  },

  active: {
    type: Boolean,
    default: true,
  },
  photo: {
    type: String,
  },

  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8,
    select: false,
  },
  confirmPassword: {
    type: String,
    required: [true, 'Please provide a confirm password'],
    minlength: 8,
    validate: {
      validator: function (el: string): boolean {
        return (this as unknown as IUserDocument).password === el;
      },
      message: 'confirm password need to be same as your password',
    },
  },
  passwordChangedAt: Date,
});

const saltRounds = 10;

// DOCUMENT MIDDLEWARE
// this refer to the document
UserSchema.methods.checkPassword = async (inputPw: string, userPw: string) => {
  return await bcrypt.compare(inputPw, userPw);
};

UserSchema.methods.changedPasswordAfter = function (jwtTimestamp: number) {
  if (this.passwordChangedAt) {
    this.passwordChangedAt.getTime();

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);

    return jwtTimestamp < changedTimestamp;
  }
  return false;
};

UserSchema.statics.findByUsername = function (username: string) {
  return this.findOne({ username });
};

// MODEL MIDDLEWARE
UserSchema.pre('save', async function () {
  (this as unknown as IUser).password = await bcrypt.hash(
    (this as unknown as IUser).password,
    saltRounds,
  );

  // remove confirmPassword from response
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  this.confirmPassword = undefined;
});

// AGGREGATE MIDDLEWARE

// QUERY MIDDLEWARE

// JUST GET THE ACTIVE USERS
UserSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

const User = mongoose.model<IUserDocument, IUserModel>('User', UserSchema);

export default User;
