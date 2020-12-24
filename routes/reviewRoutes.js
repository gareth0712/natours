const express = require('express');
const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');
// By deafult, each router only has access to parameters of their specific routes, i.e. this router has access only to routes of api/v1/reviews/
// As /tours/tourId/reviews will be redirected here, with this option, we can have access to tourId
const router = express.Router({ mergeParams: true });

// POST /tours/tourId/reviews => Create new review
// GET /tours/tourId/reviews => Get all review of the tour of #tourId
// POST /reviews => Create new review with tour id and user id in the req.body
// GET /reviews => Get all reviews
router
  .route('/')
  .get(reviewController.getAllReviews)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'user'),
    reviewController.setTourUserIds,
    reviewController.createReview
  );

router
  .route('/:id')
  .get(reviewController.getReview)
  .patch(
    authController.protect,
    authController.restrictTo('admin'),
    reviewController.updateReview
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin'),
    reviewController.deleteReview
  );

module.exports = router;
