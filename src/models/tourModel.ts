import { Document } from 'mongodb';
import mongoose, { Schema } from 'mongoose';
import slugify from 'slugify';

export interface ITour extends Document {
  name: string;
  price: number;
  start: number;
  guides: unknown[];
  [key: string]: unknown;
}

const TourSchema: Schema = new Schema<ITour>(
  {
    start: Date,
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      maxLength: [40, 'A tour name must have less than or equal to 40 characters'],
      minLength: [10, 'A tour name must have more than or equal 10'],
      // validate: [validator.isAlpha, 'Tour name must only contain characters'],
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either: easy, medium, difficult',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.6,
      max: [5, 'Rating must be below 5'],
      min: [1, 'Rating must be above 1'],
      set: (val: number) => Math.round(val * 10) / 10,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },

    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    priceDiscount: {
      type: Number,
      /**
       * solve the THIS keyword
       * https://stackoverflow.com/questions/52948723/error-in-creating-a-custom-validation-using-mongoose-with-typescript
       */
      validate: {
        validator: function (this: ITour, val: number) {
          // ! this validator not gonna work on update document
          return val < this.price;
        },
        message: 'Discount price ({VALUE}) should be below regular price',
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a description'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      // hide this field from response
      select: false,
    },

    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinate: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinate: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    // guides: Array, -- embedding
    guides: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },

  /**
   * Virtual fields used for computed properties on documents
   * sth like firstName + lastName = fullName
   * https://mongoosejs.com/docs/tutorials/virtuals.html
   */
  {
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    },
  },
);

// Single field indexes
// TourSchema.index({
//   price: 1,
// });

// Compound indexes
TourSchema.index({
  price: 1,
  ratingsAverage: 1,
});

TourSchema.index({ slug: 1 });

TourSchema.virtual('durationsWeeks').get(function () {
  // ! do not use arrow function here, THIS will be undefined
  return Math.round(this.duration / 7);
});

// Virtual Populate
TourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
  // justOne: true,
});

// *Document middleware: runs before .save() and .create()
TourSchema.pre('save', function (next) {
  // * THIS point to current DOCUMENT that being process

  this.slug = slugify(this.name, { lower: true });
  next();
});

//! IF WE HAVE MORE THAN 1 MIDDLE,
//! SHOULD CALL NEXT() ON EACH, If not it will stuck
TourSchema.pre('save', async function (next) {
  next();
});

TourSchema.pre('find', function () {
  // use this middleware to move only public tours
  // ! This middleware only work for .find() query
  // ! If we use .findById(), .findOne() => will not work

  this.find({ secretTour: { $ne: true } });
});

// POPULATING GUIDES FIELD
TourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt -role',
  });

  next();
});

// * SOLUTION
TourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });

  (this as unknown as ITour).start = Date.now();
  next();
});

TourSchema.post(/^find/, function (docs, next) {
  console.log(`Query took ${Date.now() - (this as unknown as ITour).start} milliseconds`);

  next();
});

// AGGREGATION MIDDLEWARE
TourSchema.pre('aggregate', function (next) {
  this.pipeline().unshift({
    $match: {
      price: { $gte: 4.7 },
      secretTour: { $ne: true },
    },
  });

  next();
});

const Tour = mongoose.model('Tour', TourSchema);

export default Tour;
