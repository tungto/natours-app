import mongoose, { ConnectOptions } from 'mongoose';
import * as fs from 'fs';
import * as dotenv from 'dotenv';
import Tour from '../models/tourModel';
import Review from '../models/reviewModel';
import User from '../models/userModel';
// see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
dotenv.config();

const DB = process.env.DATABASE?.replace('<PASSWORD>', process.env.DATABASE_PASSWORD as string);

mongoose.connect(
  DB as string,
  {
    useNewUrlParser: true,
    // useCreateIndex: true,
    // useFindAndModify: false,
  } as ConnectOptions,
);

mongoose.connection.on('error', (err: NodeJS.ErrnoException | null) =>
  console.log('failed to connect: ', err),
);
mongoose.connection.once('open', () => {
  console.log('Connected Successfully');
});

//  read json file
const importData = async () => {
  try {
    const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf8'));
    const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf8'));
    const reviews = JSON.parse(fs.readFileSync(`${__dirname}/reviews.json`, 'utf8'));

    await Promise.all([User.create(users), Tour.create(tours), Review.create(reviews)]);

    console.log('Data successfully loaded!');
  } catch (error) {
    console.log('failed to import data', error);
  }

  process.exit();
};

const removeData = async () => {
  try {
    await Promise.all([User.deleteMany(), Tour.deleteMany(), Review.deleteMany()]);
    console.log('Data successfully deleted');
    process.exit();
  } catch (error) {
    console.log('Failed to removed data', error);
  }
};

if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  removeData();
}
