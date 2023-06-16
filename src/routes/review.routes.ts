import express from 'express';
import * as reviewController from '../controllers/reviewController';
import * as authController from '../controllers/authController';

// * to keep parent req.params, need to add {mergeParams: true}
const reviewRouter = express.Router({ mergeParams: true });

reviewRouter
  .route('/')
  .get(reviewController.getAllReview)
  .post(
    authController.protectRoute,
    authController.restrictTo('user'),
    reviewController.setTourUserIds,
    reviewController.createReview,
  );

reviewRouter
  .route('/:id')
  .get(reviewController.getReview)
  .patch(reviewController.updateReview)
  .delete(authController.protectRoute, reviewController.deleteReview);

export default reviewRouter;
