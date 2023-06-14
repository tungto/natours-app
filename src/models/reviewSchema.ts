import mongoose, { Schema } from 'mongoose';

const ReviewSchema = new Schema({
  tour: {
    type: Schema.Types.ObjectId,
    ref: 'Tour',
    required: [true, 'Review must belong to a tour'],
  }, // parent
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Review must create by an user'],
  }, //parent
  createdAt: {
    type: Date,
    default: Date.now(),
    select: false,
  },
  review: {
    type: String,
    required: [true, 'Review should contain at least 50 character'],
    minLength: [50, 'Review should contains at least 50 character'],
    maxLength: [100, 'Review should contains max 100 character'],
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
  },
});

ReviewSchema.pre('save', function (next) {
  next();
});

// Query MIDDLEWARE
ReviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
    select: 'name photo',
  }).populate({
    path: 'tour',
    select: 'name',
  });

  next();
});

const Review = mongoose.model('Review', ReviewSchema);

export default Review;
