# Natours App

[How to Setup a TypeScript + Node.js Project](https://gist.github.com/silver-xu/1dcceaa14c4f0253d9637d4811948437)

# Express Notes

## 1. Routing

[Express Router](https://expressjs.com/en/guide/routing.html)

1. Using Router

- Server as a complete middleware and routing system

2. Alias - - instead of user need to fill in all the queries

```javascript
tourRouter.route('/top-5-cheap').get(tourController.aliasTopTours, tourController.getAllTours);
```

## 2. Error handing

[Express Error Handling](https://buttercms.com/blog/express-js-error-handling/)

[Express Doc](https://expressjs.com/en/guide/error-handling.html)

### There are two types of error

1. Operational, trusted Error: send message to client
2. Development Error: don't leak the error details

- Log error
- Send generic message

# MONGODB - MONGOOSE

1. [Mongoose Virtuals](https://mongoosejs.com/docs/tutorials/virtuals.html#mongoose-virtuals)

2. [Aggregation](https://www.mongodb.com/docs/v6.0/meta/aggregation-quick-reference/)

- $match
- $group
- [$unwind](https://www.mongodb.com/docs/manual/reference/operator/aggregation/unwind/)

> Get the busiest month of a given year
> How many tours start in each month of a given year.
> check the getMonthlyPlan controller
