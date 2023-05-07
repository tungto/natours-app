import Tour from '../models/tourSchema';

export interface ReqQuery {
  sort: string;
  limit: number;
  skip: number;
  limitFields?: string[];
  page?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

/**
 * WE CREATE THIS CLASS FOR REUSE
 * OTHER RESOURCES LIKE USERS, REVIEWS...
 */

export class APIFeatures {
  public query;
  private queryString: ReqQuery;
  // TODO FIXED TYPE
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(query: any, queryString: ReqQuery) {
    this.query = query;
    this.queryString = queryString;
  }

  /**
   * Here we will filter all the fields added to the query except excludedFields
   * list below
   * HTTP QUERY EX: { page: '1', duration: {gte: '5'}, difficulty: 'easy' }
   * MONGODB QUERY: { page: '1', duration: {$gte: 5}, difficulty: 'easy' }
   */
  filter() {
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'limit', 'fields', 'sort'];
    excludedFields.forEach((field) => delete queryObj?.[field]);

    /**
     * ADVANCE FILTER
     * 1. filter for gte, gt, le, lte
     * We will transform http query to mongodb query
     */

    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|ge|lte|lt)\b/g, (match: string) => {
      return `$${match}`;
    });

    // PARSE string query back to json before find()
    this.query = this.query.find(JSON.parse(queryStr));
    return this;
  }

  /**
   * https://www.mongodb.com/docs/manual/reference/operator/aggregation/sort/
   * Sort ascending: 1
   * descending: -1
   * https://mongoosejs.com/docs/api/query.html#Query.prototype.sort()
   */
  sort() {
    if (this.queryString.sort) {
      // -price duration
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      // sort by created date by default
      this.query = this.query.sort('-createdAt');
    }

    return this;
  }

  /**
   * * Specifies which document fields to include or exclude
   * https://mongoosejs.com/docs/api/query.html#Query.prototype.select()
   * - use query.select like below
   * - config select in tourSchema
   */
  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      // __v this field created by mongodb, we want to REMOVE it by default
      this.query = this.query.select('-__v');
    }

    return this;
  }

  paginate() {
    const page = this.queryString.page ? this.queryString.page * 1 : 1;
    const limit = this.queryString.limit || 5;
    const skip = limit * (page - 1);

    if (this.queryString.page) {
      Tour.countDocuments().then((numTours) => {
        // * Important we should check if the page > valid page
        if (skip >= numTours) {
          throw new Error('This page does not exist');
        }
      });
    } else {
      this.query = this.query.skip(skip).limit(limit);
    }

    return this;
  }
}
