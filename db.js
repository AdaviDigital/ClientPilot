// config/db.js
// Handles the MongoDB connection using Mongoose.

const mongoose = require('mongoose');

/**
 * Connects to MongoDB using the connection string in the environment variables.
 * Exits the process if the connection fails, since the app cannot function without a DB.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
