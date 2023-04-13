import dotenv from 'dotenv';
import app from './app';
import connectDB from './db/conn';

dotenv.config();

/**
 * UNCAUGHT EXCEPTION
 * we should start hearing the uncaught exception from the start to catch them all
 */

process.on('uncaughtException', (err: Error) => {
  console.log('UNCAUGHT EXCEPTION 😭! SHUTTING DOWN');
  console.log(err.name, err.message);
  server.close(() => {
    // 0 for success
    // 1 for un-caught exception
    process.exit(1);
  });
});

const ATLAS_URI = process.env.DATABASE?.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD as string,
);

const port = process.env.PORT || 3000;

connectDB(ATLAS_URI as string);

// mongoose.connection.once('open', () => {
//   console.log('Connected to MongoDB');
// });

const server = app.listen(port, () => {
  console.log(`App running on  port ${port}`);
});

/**
 * all the promise rejection that we might not catch somewhere in in the
 * application is handled here in this final safety net
 * should shutdown the server gracefully
 */
process.on('unhandledRejection', (err: Error) => {
  console.log(err.name, err.message);

  console.log('UNHANDLED REJECTION! SHUTTING DOWN....');
  gracefulShutdown();
});

const gracefulShutdown = () => {
  console.log('Received kill signal, shutting down gracefully.');
  server.close(() => {
    console.log('Closed out remaining connections.');
    process.exit(0);
  });

  // if after
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    // 0 for success
    // 1 for un-caught exception
    process.exit(1);
  }, 10000);
};
