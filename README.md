# Natours App

[How to Setup a TypeScript + Node.js Project](https://gist.github.com/silver-xu/1dcceaa14c4f0253d9637d4811948437)

# MVC architecture

- Fat Model, Skinny Controller
- Model should build with as much business logic as we can offload to them
- thin controllers with as little business logic as possible

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

#### Some notes on error and error handlers need to aware on express

- handle un-handled error
- global error handler
- custom error handler for dev env
- custom error handler for prod env
- handle 3 party error like MONGODB error: can mark as trusted/ operational error

  - validation error
  - casting error
  - duplicate document

- Global [unhandledRejection](https://nodejs.org/api/process.html#event-unhandledrejection)

  - [should shutdown the server gracefully](https://www.dashlane.com/blog/implementing-nodejs-http-graceful-shutdown)
  - Let It Crash: Best [Practices](https://blog.heroku.com/best-practices-nodejs-errors) for Handling Node.js Errors on Shutdown

### There are two types of error

1. Operational, trusted Error: send message to client
2. Development Error: don't leak the error details

- On DEVELOPMENT ENVIRONMENT we just need to log the error and send response with: status, message, error, stack
- On PRODUCTION ENVIRONMENT we treat the errors differently due to their types

  - If operational, trusted error => log the error then send it to client
  - If programming, unknown error => don't leak the details, log the error then send a generic message

#### Handling Unhandled Routes

- CUSTOM ERROR-HANDLING MIDDLEWARE NEED TO HAVE 4 ARGUMENTS: (err, req, res, next), If not, it won't fire
- [Express error-handling middleware is not being called](https://stackoverflow.com/questions/29700005/express-4-middleware-error-handler-not-being-called)

# MongoDB - Mongoose

1. [Mongoose Virtuals](https://mongoosejs.com/docs/tutorials/virtuals.html#mongoose-virtuals)

```javascript
TourSchema.virtual('durationsWeeks').get(function () {
  // ! do not use arrow function here, THIS will be undefined
  console.log(' this.durations', this.duration);
  return Math.round(this.duration / 7);
});
```

2. [Aggregation](https://www.mongodb.com/docs/v6.0/meta/aggregation-quick-reference/)

- $match
- $group
- [$unwind](https://www.mongodb.com/docs/manual/reference/operator/aggregation/unwind/)

  - Get the busiest month of a given year
  - How many tours start in each month of a given year.
  - check the getMonthlyPlan controller

3. [Middleware]

- Document middleware: runs before .save() and .create()
- Query middleware: runs before .find()

## Authentication, Authorization and Security

- [Example of](https://www.topcoder.com/thrive/articles/authentication-and-authorization-in-express-js-api-using-jwt) AUTHENTICATION AND AUTHORIZATION IN EXPRESS.JS API USING JWT

### Sign Up

### Login

### Protecting Routes

- Get token and check if it's there
- Verify the token
  - Error Handling
    - Expire token - handleJsonWebTokenError
    - Invalid token - handleJsonWebTokenError
- Check is user is still exists
- Check if the token issued after user change password
  - Add timestamp on changePasswordAfter
  - Compare token iat with change password time added above

### Roles and Permissions

#### Sources

- [Role-based access control](https://en.wikipedia.org/wiki/Role-based_access_control)
- [Implementing Role-Based Access Control (RBAC) in Node.js Express](https://tuan200tokyo.blogspot.com/2023/04/blog206-implementing-role-based-access.html)

#### Steps

1. Specific roles of user model: _user, admin, guide, lead-guide_
2. Add restrictTo to Tour Routes

- Case
  - User roles: _admin, guide-lead_ have permission to delete tour
  - Other user get error: _You do not have permission to perform this action_
