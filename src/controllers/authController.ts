import crypto from 'crypto';
import { NextFunction, Request, Response } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import User, { IUserDocument } from '../models/userSchema';
import { AppError } from '../utils/AppError';
import { catchAsync } from '../utils/catchAsync';
import { sendEmail } from '../utils/email';

// TODO refactor this type
export interface IGetUserAuthInfoRequest extends Request {
  user?: IUserDocument;
}

const signToken = (id: string) => {
  return jwt.sign({ id }, process.env.JWT_SECRET as string, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user: IUserDocument, statusCode: number, res: Response) => {
  const token = signToken(user._id);

  const cookieOptions = {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expires: new Date(Date.now() + +process.env.JWT_COOKIE_EXPIRES_IN! * 24 * 60 * 60 * 1000), // * Need convert expire date to milliseconds
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // marks the cookie to to be use with HTTPS only
  };

  // remove password from response
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-expect-error
  user.password = undefined;

  res.cookie('jwt', token, cookieOptions).status(statusCode).json({
    status: 'Logged in successfully 😊 👌',
    data: {
      user,
    },
  });
};

// SIGNUP
export const signUp = catchAsync(async (req: Request, res: Response) => {
  // ! AVOID just using req.body
  // need to specific input fields to avoid user  manually input ROLE, PHOTO...
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.password,
    passwordChangedAt: req.body.passwordChangedAt,
    role: req.body.role,
    active: req.body.active,
  });

  createSendToken(newUser as IUserDocument, 201, res);
});

// LOGIN
export const login = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  console.log('LOGIN: 🎃');
  const { email, password } = req.body;

  //1. Check if email for password is exist
  if (!email || !password) {
    // return to make sure login method end right away
    return next(new AppError('The email or password is incorrect.', 400));
  }

  const user = await User.findOne({
    email: req.body.email,
    // select password (which exclude by default in schema)
  }).select('+password');

  // 2. If user existed =>  Check if password is correct
  const match = await user?.checkPassword(req.body.password, user.password);

  if (!user || !match) {
    return next(new AppError('Incorrect email or password', 401));
  }

  if (!user) {
    return next(new AppError('User does not exist', 404));
  }

  // 3. If User existed send token
  createSendToken(user, 200, res);
});

export const protectRoute = catchAsync(
  async (req: IGetUserAuthInfoRequest, res: Response, next: NextFunction) => {
    console.log('PROTECT ROUTE 👏');

    //1. Get token ad check of it's there
    const token = req.cookies.jwt;
    // if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    //   token = req.headers?.authorization?.split(' ')[1] || '';
    // }

    if (!token) {
      next(new AppError('You are not logged in. Please login to get access', 401));
    }

    //2. Verify the token
    const decoded: JwtPayload | string = jwt.verify(token, process.env.JWT_SECRET || '');

    //3. Check if user is still exists
    const freshUser = await User.findOne({ _id: (decoded as JwtPayload).id });

    if (!freshUser) {
      return next(new AppError('The user belonging to this token no longer exist.', 401));
    }

    //4. Check if user changed password after the token issued
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    if (freshUser.changedPasswordAfter((decoded as JwtPayload).iat!)) {
      return next(new AppError('The user recently changed password! Please login again.', 401));
    }

    // GRANT ACCESS TO PROTECTED ROUTE
    req.user = freshUser;

    /**
     * !handlers and middleware, we must past them to the next() function
     * where Express will catch and process them
     */
    next();
  },
);

export const restrictTo = (...roles: string[]) => {
  console.log('RESTRICT TO 🤝');
  return (req: IGetUserAuthInfoRequest, res: Response, next: NextFunction) => {
    /// roles ['admin', 'lead-guide']

    if (!roles.includes(req.user?.role as string)) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }

    next();
  };
};

export const forgotPassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    console.log('FORGOT PASSWORD 👻');
    //1. get user base on email/username
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      return next(new AppError('There is no user with email address', 404));
    }

    //2. send validate through email => send link to reset password
    const resetToken = user.createPwResetToken();

    await user.save({ validateBeforeSave: false });

    //3. validate pw => update pw
    // here we send the origin reset token, not the encrypted one
    const resetURL = `${req.protocol}://${req.get(
      'host',
    )}/api/v1/users/resetPassword/${resetToken}`;

    const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL} .\If you didn't forget your password please ignore this email`;

    try {
      // send to email
      await sendEmail({
        email: user.email,
        message,
        subject: 'Your password reset token (valid for 10 minutes)',
      });

      res.status(200).json({
        status: 'success',
        message: 'Token sent to email!',
      });
    } catch (error) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;

      await user.save({ validateBeforeSave: false });

      return next(new AppError('There was an error sending the email. Try again latter!', 500));
    }
  },
);

/**
 *
 */
export const resetPassword = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  console.log('RESET PASSWORD 🫡');

  // 1. Get user base on token
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(new AppError('Token invalid or has expired', 400));
  }

  // 2. If token has not expired, and there is user, set the new password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  //* Saving user data might slower than token issuing in step 4
  // User.findByIdAndUpdate will NOT work as intended!
  await user.save();

  // 3. Update the changePasswordAt property for the user
  // Added in userSchema

  // 4. Log the user in
  // ! token might be created a bit before the passwordChangedAt save
  createSendToken(user, 200, res);

  // ! Note about next() function -
  // https://reflectoring.io/express-middleware/#understanding-the-next-function
  // next();
});

export const updatePassword = catchAsync(
  async (req: IGetUserAuthInfoRequest, res: Response, next: NextFunction) => {
    console.log('UPDATE PASSWORD 🤖');
    const { currentPassword, newPassword, newPasswordConfirm } = req.body;

    if (!currentPassword || !newPasswordConfirm || !newPassword) {
      return next(new AppError('Invalid password or password confirmation', 400));
    }
    //1. Get user from collection

    const currentUser: IUserDocument | null = await User.findOne({ _id: req.user?._id }).select(
      '+password',
    );

    //2. Check if Posted password is correct
    const match = await currentUser?.checkPassword(
      currentPassword,
      currentUser?.password as string,
    );

    if (!match) {
      return next(new AppError('Password is not correct.', 400));
    }

    if (currentPassword === newPassword) {
      return next(new AppError('New password should be different than the old one.', 400));
    }

    //3. If correct, update password
    (currentUser as IUserDocument).password = newPassword;
    (currentUser as IUserDocument).passwordConfirm = newPasswordConfirm;

    // save the current user instead of User.findByIdAndUpdate  run run validators and pre-save middleware
    await currentUser?.save();

    //4. Log uer in, send JWT token
    createSendToken(currentUser as IUserDocument, 200, res);
  },
);
