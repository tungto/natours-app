import { NextFunction, Request, Response } from 'express';
import User from '../models/userSchema';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/AppError';

// GET USER
export const getUser = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
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
  const user = await User.findByIdAndDelete(req.params.id);

  if (!user) {
    next(new AppError(`User not found!`, 404));
  }

  res.status(200).json({
    status: 'success',
    data: null,
  });
});
