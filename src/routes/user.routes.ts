import express from 'express';
import * as userController from './../controllers/userController';
import * as authController from '../controllers/authController';

const userRouter = express.Router();

userRouter.route('/signup').post(authController.signUp);
userRouter.route('/login').post(authController.login);
userRouter.route('/forgotPassword').post(authController.forgotPassword);
userRouter.route('/resetPassword/:token').patch(authController.resetPassword);

// Cause Middleware run in sequence, we can do sth like this
// Protect all the routes come after this route
userRouter.use(authController.protectRoute);

userRouter.route('/updatePassword').patch(authController.updatePassword);

// ME
userRouter.route('/me').get(userController.getMe, userController.getUser);
userRouter.route('/updateMe').patch(userController.updateMe);
userRouter.route('/deleteMe').patch(userController.deleteMe);

userRouter.use(authController.restrictTo('admin'));
// USER
userRouter.route('/').get(userController.getAllUsers).post(userController.createUser);
userRouter.route('/:id').get(userController.getUser).delete(userController.deleteUser);

export default userRouter;
