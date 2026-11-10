const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Database connected successfully');
  } catch (error) {
    console.log('Database connction failed',error.message);
    throw error;
  }
};
module.exports = connectDB;
