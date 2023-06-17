import bcrypt from 'bcrypt';
import crypto from 'crypto';
import mongoose, { Model } from 'mongoose';

export interface IUser {
  name: string;
  email: string;
  password: string;
  passwordConfirm: string;
  role: string;
  active?: boolean;
  photo?: string;
  passwordChangedAt?: number;
  passwordResetToken?: string | undefined;
  passwordResetExpires?: number;
}

export interface IUserDocument extends IUser, mongoose.Document {
  setPassword: (password: string) => Promise<void>;
  checkPassword: (inputPw: string, userPw: string) => Promise<boolean>;
  changedPasswordAfter: (timestamp: number) => boolean;
  createPwResetToken: () => string;
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
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
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
  passwordConfirm: {
    type: String,
    required: [true, 'Please provide a confirm password'],
    minlength: 8,
    validate: {
      // ! this validator not gonna work on update document
      validator: function (el: string): boolean {
        return (this as unknown as IUserDocument).password === el;
      },
      message: 'confirm password need to be same as your password',
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
});

const saltRounds = 10;

// DOCUMENT MIDDLEWARE
// this refer to the document
UserSchema.methods.checkPassword = async (inputPw: string, userPw: string) => {
  try {
    return await bcrypt.compare(inputPw, userPw);
  } catch (error) {
    console.log('ERROR CHECK PASSWORD', error);
  }
};

/**
 * JWT issue token with iat
 * if that iat > passwordChangedAt => token invalid
 * @param jwtTimestamp
 * @returns
 */
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

// Since the reset token only use for User type so add it as a method
UserSchema.methods.createPwResetToken = function () {
  // Always save sensitive data in encrypted
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  // send origin token
  return resetToken;
};

UserSchema.statics.findByUsername = function (username: string) {
  return this.findOne({ username });
};

// MODEL MIDDLEWARE
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  // !ALWAY ENCRYPT SENSITIVE DATA BEFORE SAVE TO DATABASE
  (this as unknown as IUser).password = await bcrypt.hash(
    (this as unknown as IUser).password,
    saltRounds,
  );

  // *remove passwordConfirm from response
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  this.passwordConfirm = undefined;

  next();
});

UserSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  // *Set passwordChangedAt back 1 second in the past as saving data to database slower than issuing the JWT token
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

// JUST GET THE ACTIVE USERS
UserSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

const User = mongoose.model<IUserDocument, IUserModel>('User', UserSchema);

export default User;
