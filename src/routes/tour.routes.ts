import express from 'express';
import * as tourController from './../controllers/tourController';

/**
 * Router can use as middleware and for routing
 * https://expressjs.com/en/4x/api.html#router
 */
const tourRouter = express.Router();

tourRouter.route('/').get(tourController.getAllTours).post(tourController.createTour);

tourRouter
  .route('/:id')
  .get(tourController.getTour)
  .patch(tourController.updateTour)
  .delete(tourController.deleteTour);

export default tourRouter;
