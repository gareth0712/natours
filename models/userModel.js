const mongoose = require('mongoose');
const validator = require('validator');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide your name.'],
    unique: true,
  },
  email: {
    type: String,
    required: [true, 'Please provide your email.'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email.'],
  },
  photo: String,
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [8, 'Password is shorter than the minimum allowed length(8)'],
    select: false, // Never show password when queried
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    minlength: [8, 'Password is shorter than the minimum allowed length(8)'],
    validate: {
      // This only works on user.save() / user.create(), i.e. only when new object is created; won't work on update, i.e. findByIdAndUpdate
      validator: function (el) {
        return el === this.password;
      },
      message: 'Passwords are not the same ',
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
});

const User = mongoose.model('User', userSchema);

module.exports = User;
