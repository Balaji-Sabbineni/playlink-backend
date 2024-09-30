require("dotenv").config();
const mongoose = require('mongoose');

// Define the MongoDB connection URL
const mongoURL = process.env.MONGO_URL;

mongoose.connect(mongoURL, {
});

const db = mongoose.connection;

db.on("connected", () => {
  console.log("Mongo Connected Successfully");
});

db.on("error", (err) => {
  console.log("Error To connect mongo db: ", err);
});

db.on("disconnected", () => {
  console.log("Mongo Disconnected Successfully");
});

// Export the database connection
module.exports = db;


