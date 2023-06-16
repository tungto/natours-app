import express from 'express';
import * as reviewController from '../controllers/reviewController';
import * as authController from '../controllers/authController';

// * to keep parent req.params, need to add {mergeParams: true}
const reviewRouter = express.Router({ mergeParams: true });

// only logged in user allowed for review
reviewRouter.use(authController.protectRoute);

reviewRouter
  .route('/')
  .get(reviewController.getAllReview)
  .post(
    authController.restrictTo('user'),
    reviewController.setTourUserIds,
    reviewController.createReview,
  );

reviewRouter
  .route('/:id')
  .get(reviewController.getReview)
  .patch(authController.restrictTo('user', 'admin'), reviewController.updateReview)
  .delete(authController.restrictTo('user', 'admin'), reviewController.deleteReview);

export default reviewRouter;
