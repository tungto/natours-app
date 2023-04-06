import mongoose, { Schema } from 'mongoose';
// import validator from 'validator';

export interface ITour {
  name: string;
  price: number;
  [key: string]: unknown;
}

const TourSchema = new Schema<ITour>(
  {
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
      select: false,
    },

    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
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

const Tour = mongoose.model('Tour', TourSchema);

export default Tour;
