import { CookieOptions, NextFunction, Request, Response } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import User, { IUserDocument } from '../models/userSchema';
import { AppError } from '../utils/AppError';
import { catchAsync } from '../utils/catchAsync';

// TODO refactor this type
export interface IGetUserAuthInfoRequest extends Request {
  user?: any;
}

const signToken = (id: string) => {
  return jwt.sign({ id }, process.env.JWT_SECRET as string, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user: IUserDocument, statusCode: number, res: Response) => {
  const token = signToken(user._id);
  const cookieOptions: CookieOptions = {
    expires: new Date(
      Date.now() + (process.env.JWT_COOKIE_EXPIRES_IN as unknown as number) * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  // remove password from response
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-expect-error
  user.password = undefined;

  res.status(statusCode).json({
    status: 'created',
    token,
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
    confirmPassword: req.body.password,
    passwordChangedAt: req.body.passwordChangedAt,
    role: req.body.role,
  });

  createSendToken(newUser as IUserDocument, 201, res);
});

// LOGIN
export const login = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
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

  // 3. If User existed send token
  if (user) {
    res.status(200).json({
      status: 'success',
      token: signToken(user._id),
    });
  }
});

export const protectRoute = catchAsync(
  async (req: IGetUserAuthInfoRequest, res: Response, next: NextFunction) => {
    //1. Get token ad check of it's there
    let token = '';
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers?.authorization?.split(' ')[1] || '';
    }

    if (!token) {
      next(new AppError('You are not logged in. Please login to get access', 401));
    }

    //2. Verify the token
    const decoded: JwtPayload | string = jwt.verify(token, process.env.JWT_SECRET || '');

    //3. Check if user is still exists
    const freshUser = await User.findOne({ _id: (decoded as JwtPayload).id });
    console.log(decoded);
    console.log(freshUser);

    if (!freshUser) {
      return next(new AppError('The user belonging to this token no longer exist.', 401));
    }

    //4. Check if user changed password after the token issued
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
  return (req: IGetUserAuthInfoRequest, res: Response, next: NextFunction) => {
    /// roles ['admin', 'lead-guide']

    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }

    next();
  };
};
