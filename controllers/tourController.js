const Tour = require('../models/tourModel');
const AppError = require('../utils/appError');

exports.getAllTours = async (req, res) => {
  try {
    // Build query
    // Query: method 1 - using filter in find
    // const tours = await Tour.find({ difficulty: 'easy' });
    // Query: method 2 - mongoose alternative method
    // const tours = await Tour.find().where('difficulty').equals('easy');

    // 1) Filtering
    const queryObj = { ...req.query };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach((el) => delete queryObj[el]);

    // handle operators: gte, gt, lte, lt
    // api: /api/v1/tours?difficulty=easy&duration[gte]=5
    // mongodb shell: db.tours.find({ difficulty: 'easy', duration: { $gte: 5 } })
    // mongoose: .find()
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
    let query = Tour.find(JSON.parse(queryStr));

    // 2) Sorting
    if (req.query.sort) {
      // default: ascending
      // api: /api/v1/tours?sort=price
      // mongodb shell: db.tours.find().sort({ price : 1 });
      // mongoose: .sort('price')
      // Add a minus sign ahead of the parameter to indicate descending order
      // api: /api/v1/tours?sort=-price
      // mongodb shell: db.tours.find().sort({ price : -1 });
      // mongoose: .sort('-price')
      // Sorting with more than 1 criteria: sort('price ratingsAverage')
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-createdAt');
    }

    // 3) Project fields to return from Query
    if (req.query.fields) {
      const fields = req.query.fields.split(',').join(' ');
      console.log(fields);
      // selecting certain field names is called 'projecting fields'
      // we won't exclude _id even if we type out specific fields, but can exclude with '-_id'
      // api: /api/v1/tours?fields=name,duration,price
      // mongodb shell: db.tours.find({},{ name: 1, duration: 1, price: 1 })
      // mongoose: query.select('name duration price');
      query = query.select(fields);
    } else {
      // "__v" is used by Mongo internally but not meaningful to user
      // Excluding field by default
      // api: /api/v1/tours?fields=-__v
      // mongodb shell: db.tours.find({}, { __v: 0 })
      // mongoose: query.select('-__v');
      query = query.select('-__v');
    }

    // 4) Pagination
    // Convert req parameters to number and Set default pagination
    const page = req.query.page * 1 || 1;
    const limit = req.query.limit * 1 || 100;
    // page=1&limit=10 => skip 0 for 1-10
    // page=2&limit=15 => skip 15 for 16-30
    // page=3&limit=5 => skip 10 for 11-15
    // formula for skip = (page - 1) * limit
    const skip = (page - 1) * limit;
    query = query.skip(skip).limit(limit);

    // Verify if page returns no result
    if (req.query.page) {
      const numTours = await Tour.countDocuments();
      if (skip >= numTours) throw new AppError('This page does not exist', 400);
    }

    // Execute query - Await only at the end after it finishes handling pagination, sort etc
    const tours = await query;

    // Send response
    res.status(200).json({
      status: 'success',
      results: tours.length,
      data: {
        tours,
      },
    });
  } catch (e) {
    res.status(404).json({
      status: 'fail',
      message: e.message,
    });
  }
};

exports.getTour = async (req, res) => {
  try {
    const tour = await Tour.findById(req.params.id);
    // Shorthand for findOne()
    // Tour.findOne({ _id: req.params.id })

    res.status(200).json({
      status: 'success',
      data: {
        tour,
      },
    });
  } catch (e) {
    res.status(404).json({
      status: 'fail',
      message: e,
    });
  }
};

exports.createTour = async (req, res) => {
  try {
    const newTour = await Tour.create(req.body);

    res.status(201).json({
      // 201 stands for created
      status: 'success',
      data: {
        tour: newTour,
      },
    });
  } catch (e) {
    console.log(e);
    res.status(400).json({
      status: 'fail',
      message: 'Invalid tour given in the request body. Tour not created.',
    });
  }
};

exports.updateTour = async (req, res) => {
  try {
    // findByIdAndUpdate method
    // 1st: id to identify the doc
    // 2nd: what data should be updated
    // 3rd: other options: e.g. { new: true } means asking the method to return the updated tour
    const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    res.status(200).json({
      status: 'success',
      data: {
        tour,
      },
    });
  } catch (e) {
    res.status(404).json({
      status: 'fail',
      message: e,
    });
  }
};

exports.deleteTour = async (req, res) => {
  try {
    await Tour.findByIdAndDelete(req.params.id);

    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (e) {
    res.status(404).json({
      status: 'fail',
      message: e,
    });
  }
};
