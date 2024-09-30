const mongoose = require("mongoose");

const usersSchema = new mongoose.Schema({
  firstname: {
    type: String,
    required: true,
  },
  lastname: {
    type: String,
    required: true,
  },
  profile: {
    type: String,
    default: "https://aws-cloudtrail-logs-992382539042-31af9dfb.s3.ap-south-1.amazonaws.com/user_profiles/profile_default.jpg",
  },
  mobileno: {
    type: String,
    required: true,
    unique: true,
  },
  otpOrderId: {
    type: String,
    required: false,
  },
  intrestedsports: {
    type: String,
    enum: [
      "football",
      "tennis",
      "badminton",
      "golf",
      "cricket",
      "swimming",
      "basketball",
    ],
    required: true,
  },
  level: {
    type: String,
    enum: ["beginner", "intermediate", "expert"],
    required: true,
  },
  age: {
    type: Number,
    required: true,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  location: {
    type: String,
    required: true
  },
  favTurfs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Turf",
  }]
});

// Create User model
const User = mongoose.model("User", usersSchema);
module.exports = User;
