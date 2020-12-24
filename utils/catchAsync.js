module.exports = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

// a = catchAsync(fn)
// becomes a = (req, res, next) => fn(req, res, next).catch(next)
// In practice, a = catchAsync((req, res, next) => res.end('Hello world'))
// becomes a = (req, res, next) => res.end('Hello world').catch(next)
// During the above process, closure allows fn to maintain its "value" (i.e. the callback function) inside a even tho the catchAsync function has already returned
