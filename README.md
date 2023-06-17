# Natours App

[MakeReddit](https://makeschool.org/mediabook/oa/tutorials/makereddit/00-get-started/)
[How to Setup a TypeScript + Node.js Project](https://gist.github.com/silver-xu/1dcceaa14c4f0253d9637d4811948437)
[Articles for the New JS Dev](https://gist.github.com/zcaceres/77fc1f6605d3e34785c416288886f8c0)
[Source](https://github.com/jonasschmedtmann/complete-node-bootcamp/tree/master)

# MVC architecture

- Fat Model, Skinny Controller
- Model should build with as much business logic as we can offload to them
- thin controllers with as little business logic as possible

# Express Notes

## 1. Routing

[Express Router](https://expressjs.com/en/guide/routing.html)
[next() function](https://reflectoring.io/express-middleware/#understanding-the-next-function)

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

## 3. MongoDB - Mongoose

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

## 4. Authentication, Authorization and Security

- [Example of](https://www.topcoder.com/thrive/articles/authentication-and-authorization-in-express-js-api-using-jwt) AUTHENTICATION AND AUTHORIZATION IN EXPRESS.JS API USING JWT

### Sign Up

### Login

### Protecting Routes

1. Get token and check if it's there
2. Verify the token

- Error Handling
  - Expire token - handleJsonWebTokenError
  - Invalid token - handleJsonWebTokenError

3.  Check is user is still exists
4.  Check if the token issued after user change password

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

### Reset and Forgot password

#### Sources

- [Implementing Secure Password Reset Functionality in Node.js Express](https://viblo.asia/p/blog220-implementing-secure-password-reset-functionality-in-nodejs-express-obA463mBJKv)

#### Steps

1. /forgotPassword

- Find user base on email
  - If user not found => send an error
- create random resetToken
- set user.passwordResetToken with hashed resetToken above, user.passwordResetExpires
- save the user - user.save() => _User save here to also run the VALIDATOR in the schema which user.update() doesn't_

2. Send Emails with Nodemailer

- If failed => remove user fields: passwordResetToken, passwordResetExpires
- URL: /api/v1/users/resetPassword/:token _Origin token, not the hashed one_
- Patch request to modify the resetPasswordToken

3. Set new password

- Get the origin resetToken from req params
- Find User base on the hashed resetToken
- Set password, passwordConfirm from req body
- Remove passwordResetToken, passwordResetExpires
- save user - _user.save()_ instead of _user.update()_ to run the validators

4. Update Current User Password

- endpoint: /updatePassword
- this route should be a protected route
- get user from collection
- check if input password match with current password
- if match, update password and log user in, send jwt token

5. Update Me
6. Delete Me => set _active: false_

- Only return active users when get all users

7. To do

- [Implement rate limiting](https://viblo.asia/p/rate-time-limit-trong-nodejs-vyDZOnkRKwj)
- Implement maximum login attempts

### Security Best Practices

1. Compromised database

- Strongly encrypt passwords with salt and hash (bcrypt)
- Strongly encrypt password reset tokens (SHA 256)

2. Brute Force Attacks

- Use _bcrypt_ to make login requests slow
- Implement rate limiting (express-rate-limit)
- Implement maximum login attempts

3. Cross-site scripting (XSS) attacks

- Store JWT in HTTPOnly cookies
- [Sanitize user input data](https://viblo.asia/p/blog211-validating-and-sanitizing-user-input-in-nodejs-express-m2vJPxYlJeK)
- [Set special HTTP headers](https://blog.logrocket.com/using-helmet-node-js-secure-application/)

4. Denial Of Service (DOS) attacks

- Implement rate limiting (express-rate-limit)
- Limit body payload (in body-parser)
- Avoid evil regular expressions

5. NOSQL Query Injection

- Use mongoose for MongoDB (because of SchemaTypes)
- [Sanitize user input data](https://viblo.asia/p/blog211-validating-and-sanitizing-user-input-in-nodejs-express-m2vJPxYlJeK)

6. Other best practices and suggestions

- [CS 253 Web Security](https://web.stanford.edu/class/cs253/)
- [JWT vs Session Cookies](https://viblo.asia/p/json-web-token-hay-session-cookies-dau-moi-la-chan-ai-Qbq5Q0oJlD8)
- [JWT vs Cookie: Why Comparing the Two Is Misleading](https://jerrynsh.com/all-to-know-about-auth-and-cookies/)
- [How to securely store JWTs in a cookie](https://blog.logrocket.com/jwt-authentication-best-practices/#store-jwts-securely)
- [Use cookies securely](https://expressjs.com/en/advanced/best-practice-security.html#use-cookies-securely)
- [NodeJS Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Nodejs_Security_Cheat_Sheet.html)

- Always use HTTPS
- Create random password reset tokens with expire dates
- Deny access to JWT after password change
- Don't commit sensitive config data to Git
- Don't send error details to clients
- Present Cross-site request forgery (csurf package)
- Require re-authentication before high-value action
- Implement a blacklist of untrusted JWT
- Confirm user email address after first creating account
- Keep user logged in with refresh token
- Implement two factor authentication
- [Prevent parameter pollution](https://securityintelligence.com/posts/how-to-prevent-http-parameter-pollution/) [causing Uncaught Exceptions](https://levelup.gitconnected.com/prevent-parameter-pollution-in-node-js-f0794b4650d2)

# DATA MODELING

- [Data Model Design](https://www.mongodb.com/docs/manual/core/data-model-design/#std-label-data-modeling-referencing)
- [Populating data](https://viblo.asia/p/tim-hieu-ve-populate-trong-mongoogse-GrLZDvpE5k0)
- [Populating Virtual](https://mongoosejs.com/docs/tutorials/virtuals.html#populate)
- [Factory Functions and the Module Pattern](https://www.theodinproject.com/lessons/node-path-javascript-factory-functions-and-the-module-pattern)

## Different Types of Relationships between data

## Referencing/ Normalization vs Embedding/ Denormalization

## Embedding or referencing other document?

## Types of referencing

## [Indexes](https://www.mongodb.com/docs/manual/indexes/)
