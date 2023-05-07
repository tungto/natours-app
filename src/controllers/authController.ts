import { CookieOptions, NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUserDocument } from '../models/userSchema';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/AppError';

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

  console.log(req.body.email);
  console.log(user);

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
