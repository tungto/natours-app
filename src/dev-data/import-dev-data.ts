import mongoose, { ConnectOptions } from 'mongoose';
import * as fs from 'fs';
import * as dotenv from 'dotenv';
import Tour from '../models/tourSchema';
// see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
dotenv.config();

const DB = process.env.DATABASE?.replace('<PASSWORD>', process.env.DATABASE_PASSWORD as string);
console.log(process.env.DATABASE);
console.log(DB);

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
    const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours-simple.json`, 'utf8'));

    await Tour.create(tours);

    console.log('Data successfully loaded!');
  } catch (error) {
    console.log('failed to import data', error);
  }

  process.exit();
};

const removeData = async () => {
  try {
    await Tour.deleteMany();
    console.log('Data successfully deleted');
  } catch (error) {
    console.log('Failed to removed data', error);
  }
};

if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  removeData();
}
