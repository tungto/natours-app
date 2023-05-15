import { NextFunction, Request, Response } from 'express';
import User from '../models/userSchema';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/AppError';
import { IGetUserAuthInfoRequest } from './authController';

// todo update types
// Only update allowed fields, remove fields not-allowed like role...
const filterObj = (data: any, allowedFields: string[]) => {
  const finalObj: any = {};
  allowedFields.forEach((key) => {
    finalObj[key] = data[key];
  });

  return finalObj;
};

// GET USER
export const getUser = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  console.log('GET CURRENT USER 👍');
  const user = await User.findById(req.params.id);

  if (!user) {
    next(new AppError(`User not found!`, 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      user,
    },
  });
});

export const getAllUsers = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  console.log('GET ALL USERS');
  const users = await User.find();

  if (!users) {
    next(new AppError(`User not found!`, 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      users,
    },
  });
});

// UPDATE USER
export const updateUser = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  console.log('UPDATE USER 👏');
  /**
   * NOTE HERE: we need to re-run validator when update user
   * options: new = true => because fault value of new is false, need to change to true to get the updated value not the previous one
   */
  const user = await User.findByIdAndDelete(req.params.id, { new: true, runValidators: true });

  if (!user) {
    next(new AppError(`User not found!`, 404));
  }

  res.status(200).json({
    status: 'success',
    data: null,
  });
});

// DELETE USER
export const deleteUser = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  console.log('DELETE USER 🤌');
  const user = await User.findByIdAndDelete(req.params.id);

  if (!user) {
    next(new AppError(`User not found!`, 404));
  }

  res.status(200).json({
    status: 'success',
    data: null,
  });
});

export const updateMe = catchAsync(
  async (req: IGetUserAuthInfoRequest, res: Response, next: NextFunction) => {
    console.log('UPDATE USER - ME 🫶');
    // filter change password route
    if (req.body.password || req.body.confirmPassword) {
      return next(
        new AppError('This route is not for password update. Please use /updateMe.', 400),
      );
    }

    const updateObj = filterObj(req.body, ['email', 'name']);

    console.log('updateObj', updateObj);

    // !For non-sensitive data we can use findByIdAndUpdate
    const updatedUser = await User.findByIdAndUpdate(req.user?._id, updateObj, {
      // return updated one
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      status: 'success',
      data: updatedUser,
    });
  },
);
