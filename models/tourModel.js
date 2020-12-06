const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');

// We can specify schema type options using objects
const tourSchema = new mongoose.Schema(
  // Schema definition
  {
    name: {
      type: String,
      unique: true,
      trim: true, // Only work for string -> Remove write spaces in beginning and the end
      // Validators
      required: [true, 'A tour must have a name'],
      // This only works for create / save => for update to work, need to set runValidator option to true in the findByIdAndUpdate method => It will then make use of validators in tourSchema
      // The following validators are only for strings
      maxLength: [40, 'A tour must have less or equal than 40 characters'],
      minlength: [10, 'A tour name must have more or equal to 10 characters'],
      // Other than putting an object for custom message, we can also use array in case we make use of defined callback function for higher readibility
      // validate: [validator.isAlpha, 'Tour name must only contain characters'],
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      require: [true, 'A tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      // enum validator is only for strings
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either: easy, medium or difficult',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      // This validator works for dates and numbers
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    priceDiscount: {
      type: Number,
      // If we want shortcut for entering custom validator, we can simply input the function without wrapping it with an object
      validate: {
        validator: function (val) {
          // 'this' only points to current doc on NEW document creation, i.e. this only works on .save(), .create() but not work on .update()
          // if false then will trigger the validation error
          return val < this.price;
        },
        // Message also has access to the input value using Mongoose syntax
        message: 'Discount price ({VALUE}) must be lower than original price',
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a summary description'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(), // Mongo will auto-convert milliseconds to date
      select: false,
    },
    // shortcut for { type: [Date] }
    startDates: [Date], // e.g. "2021-03-21" -> Mongo will auto-converted to JS Date; if it can't it will throw an error
    secretTour: {
      type: Boolean,
      default: false,
    },
  },
);
});

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
