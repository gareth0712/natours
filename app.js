const fs = require('fs');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');

const app = express();

// 1) GLOBAL Middlewares
// Helmet() returns a number of middleware functions that help set security HTTP headers
app.use(helmet());

// For dev logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Limit requests from same IP
// 100 requests from the same ip in an hour
// crashing will reset the limit
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour',
});
// Only effective for routes that starts with api
app.use('/api', limiter);

// Body parser, reading data from body and store into req.body
// and limit the req body to 10kb or it will reject the request body
app.use(express.json({ limit: '10kb' }));

// Data Sanitization against NoSQL query injection
// The function returns a middleware function that can then be used upon handling requests
// It will remove all the dollar sign and dots, e.g. { "$gt": "" } will not work
app.use(mongoSanitize());

// Data Sanitization against XSS attacks
// Clean user input from malicious html/js code
// We do protection in the schema definition. With this, we further protect against improper user input
app.use(xss());

// Prevent HTTP Parameter Pollution
// e.g. duplicate sort in getAllTour will crash the query
app.use(
  hpp({
    // Input parameter to Whitelist allows duplication
    whitelist: [
      'duration',
      'ratingsAverage',
      'difficulty',
      'maxGroupSize',
      'ratingsQuantity',
      'price',
    ],
  })
);

// Serve static files
app.use(express.static(`${__dirname}/public`));

// For showing request headers
app.use((req, res, next) => {
  console.log(req.headers);
  next();
});

// For marking date and time of request
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// 2) Route Handlers placed in routes directory

// 3) Routes
// We want to use the middleware for this specific route "/api/v1/tours"
// The following process is called mounting a new router on a route
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/routes', reviewRouter);

// All HTTP methods; * stands for everything
app.all('*', (req, res, next) => {
  // const err = new Error(`Can't find ${req.originalUrl} on this server.`);
  // err.status = 'fail';
  // err.statusCode = 404;

  // Express assumes everything we pass to next is an error and this applies to every next function in every single middleware anywhere in our application
  // And will ignore other middlewares in the middleware stack and send the error that we pass in to the global error handling middleware
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Error handling middleware: first argument is err
// By specifying the arguments in this way, Express automatically knows this entire function
// is error handling middleware
app.use(globalErrorHandler);

// 4) Start server in server.js
module.exports = app;
