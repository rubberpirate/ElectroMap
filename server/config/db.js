const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      console.error('MONGO_URI is not set. Skipping MongoDB connection.');
      return;
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Atlas connected successfully');
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
  }
};

module.exports = connectDB;
