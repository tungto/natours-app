import express from 'express';
import * as reviewController from '../controllers/reviewController';
import * as authController from '../controllers/authController';

const reviewRouter = express.Router();

reviewRouter
  .route('/')
  .get(reviewController.getAllReview)
  .post(
    authController.protectRoute,
    authController.restrictTo('user'),
    reviewController.createReview,
  );

reviewRouter
  .route('/:id')
  .get(reviewController.getReview)
  .patch(reviewController.updateReview)
  .delete(authController.protectRoute, reviewController.deleteReview);

export default reviewRouter;
