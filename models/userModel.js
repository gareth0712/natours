const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

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

// pre save middleware (Encryption) runs between the moment we receive the data and persist the data into DB
// 'this' has access to the current document
userSchema.pre('save', async function (next) {
  // Only run this function if pw was actually modified => avoid encrypting encrypted password again
  // isModified: A method for all document to check if the field has been modified
  if (!this.isModified('password')) return next();

  // The Hash method of bcrypt encrypts the pw
  // bcrypt's hashing algorithm protects the pw against brute force attack
  // It salts the password before hashing. So even if the passwords of two users are the same, their hashed pw will be different
  // has the password with cost of 12; default is 10
  // The higher the value of salt is, the more cpu-intensive the process will be and the better the password will be encrypted
  this.password = await bcrypt.hash(this.password, 12);
  // Required input in schema definition != Required field in db
  // Merely serve the purpose of confirmation to avoid user typing wrong password
  // We do not need this field in db => delete passwordConfirm field
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000; // Sometimes the JWT is created before the passwordChangedAt timestamp, in that case the jwt will be immediately become invalid => - 1000 to eliminate this case
  next();
});

// Instance method: Method that is available for all documents of a certain collection
// Create the method here to as it is related to the data itself and to fulfill the MVC architecture that model handles the business logic in checking password
userSchema.methods.correctPassword = async (
  candidatePassword,
  userPassword
) => {
  // Ideal way is to use this.password for comparison with candidatePassword
  // With select: false for password field, this.password is not available here
  // bcrypt.compare is async function
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    console.log(changedTimestamp, JWTTimestamp);
    // JWT earlier => PW Changed after JWT is issued
    return JWTTimestamp < changedTimestamp;
  }

  // False means NOT changed
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  // No need to be cryptographically strong as the hashed PW, so use built-in crypto module
  // Only user will have access to this token to reset password => Before user reset the pw, this token serves as a password for user
  // Random Bytes converted to Hexadecimal string
  const resetToken = crypto.randomBytes(32).toString('hex');

  // We store encrypted token/password only in DB
  this.passwordResetToken = crypto
    .createHash('sha256') // calculate a hash
    .update(resetToken) // update method: push data to later be turned into a hash with the digest method => Encrypt the resetToken with sha256
    .digest('hex'); // Store it as a Hexadecimal

  console.log({ resetToken }, this.passwordResetToken);

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
