const mongoose = require('mongoose');
const validator = require('validator');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review cannot be empty'],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      required: [true, 'Review must belong to a tour.'],
      ref: 'Tour',
    },
    user: {
      type: mongoose.Schema.ObjectId,
      required: [true, 'Review must belong to a user.'],
      ref: 'User',
    },
  },
  {
    // When output as JSON / Object, we want virtuals to be part of the output
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
