const AppError = require('../utils/appError');

// CastError occurrs when Mongoose is unable to find the value in the respective field in MongoDB
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

// Duplicate input in field where the unique property is set to true in schema definition
const handleDuplicateFieldsDB = (err) => {
  const value = err.keyValue.name;
  const message = `Duplicate field value: ${value}. Please use another value.`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((val) => val.message);
  // Make sure each message ends with full stop and a space for a complete paragraph
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProd = (err, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    // Programming or other unknown error: don't leak error details
    // 1) Log error
    console.error('ERROR', err);

    // 2) Send gen
    res.status(500).json({
      status: 'error',
      message: 'Error occurred. Please contact administrator for help',
    });
  }
};

module.exports = (err, req, res, next) => {
  console.log(err);

  // Could be errors without statusCode / status or not created by us (e.g. error from mongodb)
  // => Set it to 500 in case error without status code
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    // In dev, we want to produce as much info as possible to trace error
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    // For operational error, we can return something more meaningful for users
    if (err.name === 'CastError') error = handleCastErrorDB(error);
    if (err.code === 11000) error = handleDuplicateFieldsDB(error); // code 11000 indicates duplicate field
    if (err.name === 'ValidationError') error = handleValidationErrorDB(error); // With err.name: Error created by Mongoose
    sendErrorProd(error, res);
  }
};
