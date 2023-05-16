import express from 'express';
import * as userController from './../controllers/userController';
import * as authController from '../controllers/authController';

const userRouter = express.Router();

userRouter.route('/signup').post(authController.signUp);
userRouter.route('/login').post(authController.login);

userRouter.route('/forgotPassword').post(authController.forgotPassword);
userRouter.route('/resetPassword/:token').patch(authController.resetPassword);

userRouter.route('/:id').get(authController.protectRoute, userController.getUser);
userRouter
  .route('/updatePassword')
  .patch(authController.protectRoute, authController.updatePassword);

userRouter.route('/updateMe').patch(authController.protectRoute, userController.updateMe);
userRouter.route('/deleteMe').patch(authController.protectRoute, userController.deleteMe);

userRouter.route('/').get(userController.getAllUsers);

export default userRouter;
