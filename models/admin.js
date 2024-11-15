const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema({
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
    default:
      `https://${process.env.S3_BUCKET_NAME}.s3.ap-south-1.amazonaws.com/user_profiles/profile_default.jpeg`,
  },
  mobileno: {
    type: String,
    required: true,
  },
  ifscCode: {
    type: String,
    required: true
  },
  accountNumber : {
    type: String,
    required: true
  },
  accountName : {
    type: String,
    required : true
  }
});

// Create User model
const Admin = mongoose.model("Adminuser", adminSchema);
module.exports = Admin;
