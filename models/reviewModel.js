const mongoose = require('mongoose');
const Tour = require('./tourModel');

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

reviewSchema.pre(/^find/, function (next) {
  // For performance concern, tour is not populated as it's not important to have tour details in reviews
  // this.populate({
  //   path: 'user',
  //   select: 'name photo',
  // }).populate({
  //   path: 'tour',
  //   select: 'name',
  // });
  this.populate({
    path: 'user',
    select: 'name photo',
  });
  next();
});

// Static method
// We use static method since its 'this' keyword points to the model
// And we need to call the aggregate function of the model to calc the average ratings

reviewSchema.statics.calcAverageRatings = async function (tourId) {
  // 'this' now points to the model where we can call the aggregate method
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 }, // Add one for each of the doc
        avgRating: { $avg: '$rating' },
      },
    },
  ]);
  // console.log(stats) => e.g. [ { _id: 5fe5b7b722ea38921c00a8aa, nRating: 10, avgRating: 4.9 } ]
  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 0,
    });
  }
};

// Using post-save middleware ensures current doc has saved in collections
// and should be included in the aggregate method in calcAverageRatings
reviewSchema.post('save', function (doc, next) {
  // 'this' points to current document, i.e. review, and that is same as doc variable
  // this.constructor/doc.constructor points to the model of the document
  doc.constructor.calcAverageRatings(doc.tour);
  // We can't place this middleware below `const Review =...` line in order to have access to "Review" model directly
  //  since at that time, the model would have already been created with the middlewares declared above that line
  next();
});

// Upon delete / update review, the ratingsQuantity and ratingsAverage should also be updated
// findByIdAndUpdate & findByIdAndDelete => Shorthand of findOneAnd... with the current ID
// 'this' is the query object => At this point of time, 'this' contains the review id (supplied by the req.params.id)
// Thus, this.findOne() can return the review object before update/delete; i.e. we execute another query before the required query (findAndUpdate/findAndDelete) is executed
// e.g. { createdAt: 2020-12-26T22:49:14.760Z,  _id: 5fe7bdeb65c3b4419cf0a901,  review: 'My favorite tour',  rating: 5,  tour: 5fe5b7b722ea38921c00a8aa,  user: { _id: c8a1dfa2f8fb814b56fa181, name: 'Lourdes Browning', photo: 'user-2.jpg'}, __v: 0,  id: '5fe7bdeb65c3b4419cf0a901' }
//
reviewSchema.pre(/^findOneAnd/, async function (next) {
  this.review = await this.findOne(); // the review object (Before update/delete) is stored as a property of the query object
  console.log(this.review);
  next();
});

reviewSchema.post(/^findOneAnd/, async function () {
  // After execution, the query has already executed and it contains the result of query and we cannot call query methods like findOne() anymore here
  // We call calcAverageRatings again to update the quantity and avg of reviews to db after update/delete
  await this.review.constructor.calcAverageRatings(this.review.tour);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
