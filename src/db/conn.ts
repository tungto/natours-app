import mongoose, { ConnectOptions } from 'mongoose';

const connectDB = async (ATLAS_URI: string) => {
  try {
    await mongoose.connect(
      ATLAS_URI as string,
      {
        useNewUrlParser: true,
        // useFindAndModify: false,
        // useUnifiedTopology: true,
      } as ConnectOptions,
    );
    const db = mongoose.connection;

    db.once('open', () => {
      console.log('Connected Successfully');
    });
  } catch (error) {
    console.log('connection error', error);
  }
};

export default connectDB;
