import mongoose, { Model, Schema } from 'mongoose';
import Tour from './tourModel';
import { Document } from 'mongodb';

interface IReview {
  tour: string;
  user: string;
  createdAt: Date;
  review: string;
  rating: number;
}
interface IReviewDocument extends IReview, Document {}
interface IReviewModel extends Model<IReviewDocument> {
  calcAverageRating: (username: string) => void;
}

const ReviewSchema = new Schema<Document>(
  {
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
      minLength: [10, 'Review should contains at least 50 character'],
      maxLength: [1000, 'Review should contains max 100 character'],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
  },
  {
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    },
  },
);

// to prevent duplicated review create by one user
ReviewSchema.index({ tour: 1, user: 1 }, { unique: true });

// Query MIDDLEWARE
ReviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
    select: 'name role',
  });

  next();
});

// static method
ReviewSchema.statics.calcAverageRating = async function (tourId) {
  console.log(this);
  // In statics this point to ReviewSchema not the current document
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);

  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsAverage: stats[0].avgRating,
      ratingsQuantity: stats[0].nRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsAverage: 0,
      ratingsQuantity: 4.5,
    });
  }

  console.log('stats', stats);
};

// UPDATE rating quantity, avg on review created
// * using post not pre save cause at this time all documents already saved in database
ReviewSchema.post('save', function () {
  // this point to current review (real value)
  console.log('THIS TOUR AFTER POST:', this); // this point to current document => review
  // todo check hoisting
  Review.calcAverageRating(this.tour);
});

// findOneAndUpdate => return the Query with ID input => then we intercept the query here
// Handle with findOneAndUpdate, the review removed from collection, so we save it as this.r to use in post middleware
ReviewSchema.pre(/^findOneAnd/, async function (next) {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  this.r = await this.clone().findOne();
  next();
});

// UPDATE rating quantity, avg on review updated/deleted
ReviewSchema.post(/^findOneAnd/, async function () {
  /**
   * Mongoose no longer allows executing the same query object twice
   * https://mongoosejs.com/docs/migrating_to_6.html#duplicate-query-execution
   */

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //@ts-expect-error
  Review.calcAverageRating(this.r.tour);
});

const Review = mongoose.model<IReviewDocument, IReviewModel>('Review', ReviewSchema);

export default Review;
