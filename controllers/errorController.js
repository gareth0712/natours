module.exports = (err, req, res, next) => {
  console.log(err.stack);

  // Could be errors without statusCode / status or not created by us (e.g. error from mongodb)
  // => Set it to 500 in case error without status code
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
  });
};
