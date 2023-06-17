/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextFunction, Request, Response } from 'express';
import User from '../models/userModel';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/AppError';
import { IGetUserAuthInfoRequest } from './authController';
import * as factory from './handlerFactory';

// todo update types
// Only update allowed fields, remove fields not-allowed like role...
const filterObj = (data: any, allowedFields: string[]) => {
  const finalObj: any = {};
  allowedFields.forEach((key) => {
    finalObj[key] = data[key];
  });

  return finalObj;
};

/**
 * BY ADMINISTRATOR
 */
export const getAllUsers = factory.getAll(User);
export const getUser = factory.getOne(User);
export const createUser = (req: Request, res: Response) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not defined! Please use /signup instead',
  });
};
export const updateUser = factory.updateOne(User); // SAVE and VALIDATION middleware don't trigger on this, DO NOT update pw with this!
export const deleteUser = factory.deleteOne(User); //REMOVE FROM DB

/**
 * BY THE USER
 * @param req
 * @param res
 * @param next
 */
export const getMe = (req: IGetUserAuthInfoRequest, res: Response, next: NextFunction) => {
  req.params.id = req?.user?.id;
  next();
};

/**
 * NOTE HERE: we need to re-run validator when update user
 * options: new = true => because fault value of new is false, need to change to true to get the updated value not the previous one
 */
export const updateMe = catchAsync(
  async (req: IGetUserAuthInfoRequest, res: Response, next: NextFunction) => {
    console.log('UPDATE USER - ME 🫶');

    //1. Create error if user POST password data
    if (req.body.password || req.body.confirmPassword) {
      return next(
        new AppError('This route is not for password update. Please use /updateMe.', 400),
      );
    }

    //2.  Filter out fields name that are not allow to be updated
    const updateObj = filterObj(req.body, ['email', 'name']);

    //3. Update user document
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

// DELETE ME - Just set active status to false, don't remove user data from DB
export const deleteMe = catchAsync(
  async (req: IGetUserAuthInfoRequest, res: Response, next: NextFunction) => {
    console.log('DELETE USER 🤌');
    const deletedUser = await User.findByIdAndUpdate(
      req.user?.id,
      { active: false },
      { new: true },
    );

    if (!deletedUser) {
      next(new AppError(`Token invalid, please login again!`, 400));
    }

    res.status(200).json({
      status: 'success',
      data: deletedUser,
    });
  },
);
