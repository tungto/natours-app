import mongoose from 'mongoose';
import isEmail from 'validator';

const UserSchema = new mongoose.Schema({
  _id: { type: String, unique: true },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    // There are two ways for an promise-based async validator to fail:
    // 1. If the promise rejected => failed with given error
    // 2. If the promise resolved to false => Mongoose create an error with the given message
    validate: [isEmail, 'invalid email'],
  },
  role: {
    type: String,
  },

  active: {
    type: Boolean,
    default: false,
  },
  photo: {
    type: String,
  },

  password: {
    type: String,
    required: true,
    select: false,
  },
});

const User = mongoose.model('User', UserSchema);

// User.schema.post('save', (err: MongoServerError, doc, next: NextFunction) => {
//   if (err.name === 'MongoServerError' && err.code === 11000) {
//     next(new AppError('There was a duplicate key error', 500));
//   } else {
//     next();
//   }
// });

// DOCUMENT MIDDLEWARE
// this refer to the document

// MODEL MIDDLEWARE

// AGGREGATE MIDDLEWARE

// QUERY MIDDLEWARE

export default User;
