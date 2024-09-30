const mongoose = require("mongoose");

const turfSchema = new mongoose.Schema({
  images: {
    type: String,
    default:
      "https://aws-cloudtrail-logs-992382539042-31af9dfb.s3.ap-south-1.amazonaws.com/turf_images/truf_default.jpg",
  },
  category: {
    type: String,
    required: true,
  },
  turfname: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  playwithstranger: {
    type: Boolean,
    default: false,
  },
  court: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  amenties: {
    type: [String], // Store as an array of strings
    required: false,
  },
  rating: {
    type: Number,
    required: true,
  },
  slots: {
    type: [
      {
        time: {
          type: String,
          required: true,
        },
        price: {
          type: Number,
          required: true,
        },
      },
    ], // Store as an array of objects
    required: true,
  },
  discounts: {
    type: Number, // Add a field for discounts
    required: false,
  },
  ownerMobileNo: {
    type: String,
    required: true
  }
});

// Create Turf model
const Turf = mongoose.model("Turf", turfSchema);
module.exports = Turf;
