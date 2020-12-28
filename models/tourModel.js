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
      set: (val) => Math.round(val * 10) / 10, // Math.round by default round to nearest integer
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
    // For Geospatial data, we need to create a new object with at least 2 fields: coordinates and type
    startLocation: {
      // GeoJSON
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    // Embedded documents: using array to store the locations
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    // guides: Array, + pre-save middleware for embedding guides below=> embedded document
    guides: [
      // Reference
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    // When output as JSON / Object, we want virtuals to be part of the output
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// INDEX
// With index, MongoDB can use the index to limit the number of documents it must inspect
// Each index uses resources (Index will be Updated when the underlying collection updates) => Create index for fields that user queries the most
// If a field is set to unique, e.g. name, Mongodb will create a unique index by default
// We can also create index to make query faster => To prove it's faster, we use the explain() method for query to check how many docs are examined
// 1 means the index is sorted in ascending order while -1 is the opposite
// Compound index works also if we query for one of the fields inside compound index individually
// Therefore, when we create compound index, we don't need to create individual index for fields inside the compound index
tourSchema.index({ price: 1, ratingsAverage: -1 }); // Compound index
tourSchema.index({ slug: 1 });

// Virtual properties are properties that are defined in schema but not persistent as they can be derived from other fields to save db space
// Business logic better be handled in model instead of controller, which handles application logic
tourSchema.virtual('durationWeeks').get(function () {
  // 'this' is pointing to the current document
  return this.duration / 7;
});

// Virtual populate instead of child referencing as we do not want the reviews array to grow indefinitely
// Solely virtual populate "reviews" here is not enough to show the "reviews" field in API
// In the API, e.g. getTour API, we need to add populate('reviews') to Tour.findById(req.params.id)
// To ensure it gets shown
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});

// Mongoose middleware

// 1. Document middleware
// .pre + 'save' indicates that it is a Pre-save middleware / hook
// It is called Document middleware as it has access to docment. It runs before .save() and .create().
// .insertMany() won't trigger this middleware
// Each middleware function in a pre-save hook has access to next and has 'this' keyboard pointing to the document
tourSchema.pre('save', function (next) {
  // We call this document middleware because we have access to the current document
  this.slug = slugify(this.name, { lower: true });
  next();
});

// pre-saved middleware for embedding guides
// tourSchema.pre('save', async function (next) {
//   const guidesPromises = this.guides.map(async (id) => await User.findById(id)); // array.map will merely assign the promises to new array
//   this.guides = await Promise.all(guidesPromises); // Need to consume the promises in guidesPromises

//   next();
// });

// .post indicates that it is a post-save middleware
// It executes after all pre middleware completed
// It has access to not only next function,but also to the document just saved
// It no longer has the this keyword, but the doc object
tourSchema.post('save', function (doc, next) {
  console.log(doc._id);
  next();
});

// 2. Query Middleware
// .pre + 'find' => Query middleware => 'this' in query middleware is a query object
// When we execute Tour.find() in tourController, i.e. "await features.query",
// right before it executes, this query middleware will be executed first
// All the strings that start with find, e.g. findone
tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();
  next();
});

// "guides" are referencing users and when we query a tour, the guide info can be "linked up" using populate
// Populate will create another query => Performance will be affected if it's used in large scale / too often
tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt',
  });
  next();
});

// .post + 'find' => Post query middleware
// Query has finished at this point and so the function has access to the query object with result
// We cannot execute methods like find/fineOne etc
tourSchema.post(/^find/, function (docs, next) {
  console.log(`Query took ${(Date.now() - this.start) / 1000} seconds`);
  next();
});

// 3. Aggregation Middleware
// 'this' points to the current aggregation object
// pipeline function returns an array of the aggregation pipelines with stages
tourSchema.pre('aggregate', function (next) {
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
  next();
});

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
