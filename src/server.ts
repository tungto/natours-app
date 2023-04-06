import dotenv from 'dotenv';
import app from './app';
import connectDB from './db/conn';
import mongoose from 'mongoose';

dotenv.config();

const ATLAS_URI = process.env.DATABASE?.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD as string,
);

const port = process.env.PORT || 3000;

console.log(ATLAS_URI);

connectDB(ATLAS_URI as string);

mongoose.connection.once('open', () => {
  console.log('Connected to MongoDB');
  app.listen(port, () => {
    console.log(`App running on  port ${port}`);
  });
});
