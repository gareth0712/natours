class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach((el) => delete queryObj[el]);

    // handle operators: gte, gt, lte, lt
    // api: /api/v1/tours?difficulty=easy&duration[gte]=5
    // mongodb shell: db.tours.find({ difficulty: 'easy', duration: { $gte: 5 } })
    // mongoose: .find()
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
    this.query = this.query.find(JSON.parse(queryStr));

    // Return the entire object for chaining other methods
    return this;
  }

  sort() {
    if (this.queryString.sort) {
      // default: ascending
      // api: /api/v1/tours?sort=price
      // mongodb shell: db.tours.find().sort({ price : 1 });
      // mongoose: .sort('price')
      // Add a minus sign ahead of the parameter to indicate descending order
      // api: /api/v1/tours?sort=-price
      // mongodb shell: db.tours.find().sort({ price : -1 });
      // mongoose: .sort('-price')
      // Sorting with more than 1 criteria: sort('price ratingsAverage')
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt');
    }

    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      console.log(fields);
      // selecting certain field names is called 'projecting fields'
      // we won't exclude _id even if we type out specific fields, but can exclude with '-_id'
      // api: /api/v1/tours?fields=name,duration,price
      // mongodb shell: db.tours.find({},{ name: 1, duration: 1, price: 1 })
      // mongoose: query.select('name duration price');
      this.query = this.query.select(fields);
    } else {
      // "__v" is used by Mongo internally but not meaningful to user
      // Excluding field by default
      // api: /api/v1/tours?fields=-__v
      // mongodb shell: db.tours.find({}, { __v: 0 })
      // mongoose: query.select('-__v');
      this.query = this.query.select('-__v');
    }
    return this;
  }

  paginate() {
    // Convert req parameters to number and Set default pagination
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 100;
    // page=1&limit=10 => skip 0 for 1-10
    // page=2&limit=15 => skip 15 for 16-30
    // page=3&limit=5 => skip 10 for 11-15
    // formula for skip = (page - 1) * limit
    const skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);

    return this;
  }
}
