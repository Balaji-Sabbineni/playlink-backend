const express = require("express");
const routes = express.Router();
const AdminUser = require('../models/admin');
const { sendOTP, resendOTP, verifyOTP } = require('otpless-node-js-auth-sdk');
const multer = require("multer");
const multerS3 = require("multer-s3");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken"); // Add JWT for authentication
require("dotenv").config();
const { authenticateToken } = require('../config/authenticate');

// Configure AWS SDK
const { S3Client } = require("@aws-sdk/client-s3");
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Configure multer and multerS3 for image uploads
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.S3_BUCKET_NAME,
    acl: "public-read",
    key: function (req, file, cb) {
      cb(null, `user_profiles/${Date.now()}_${file.originalname}`);
    },
  }),
});

// Create a new admin user
routes.post("/", async (req, res) => {
  try {
    const data = req.body;

    // Hash the password before saving
    // const hashedPassword = await bcrypt.hash(data.password, 10);
    // data.password = hashedPassword;

    // Create a new admin user document using the mongoose model
    const newAdminUser = new AdminUser(data);

    // Save the new admin user to the database
    const response = await newAdminUser.save();
    console.log("Admin user saved successfully");
    res.status(200).json(response);
  } catch (error) {
    console.log("Error saving admin user", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get an admin user by mobile number
routes.get('/:mobileno', async (req, res) => {
  try {
    const mobileno = "+91"+req.params.mobileno;
    const adminUser = await AdminUser.findOne({ mobileno: mobileno });
    if (!adminUser) {
      return res.status(404).json({ message: "Admin user not found" });
    }
    res.status(200).json(adminUser);
  } catch (error) {
    console.log("Error retrieving admin user", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Update an admin user's profile picture
routes.put("/profile/:id", upload.single('profile'), async (req, res) => {
  try {
    const adminUserId = req.params.id;
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "Profile image is required" });
    }

    const profileUrl = file.location;
    const updatedAdminUser = await AdminUser.findByIdAndUpdate(adminUserId, { profile: profileUrl }, { new: true });
    if (!updatedAdminUser) {
      return res.status(404).json({ error: "Admin user not found" });
    }

    console.log("Admin user profile updated successfully");
    res.status(200).json(updatedAdminUser);
  } catch (error) {
    console.log("Error updating admin user profile", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Update an admin user
routes.put("/:id", async (req, res, next) => {
  try {
    const adminUserId = req.params.id;
    const updates = req.body;
    const options = { new: true };


    const updatedAdminUser = await AdminUser.findByIdAndUpdate(adminUserId, updates, options);
    if (!updatedAdminUser) {
      return res.status(404).json({ error: "Admin user not found" });
    }

    console.log("Admin user updated successfully");
    res.status(200).json(updatedAdminUser);
  } catch (error) {
    console.log("Error updating admin user", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Delete an admin user
routes.delete("/:id", async (req, res) => {
  try {
    const adminUserId = req.params.id;

    const deletedAdminUser = await AdminUser.findByIdAndDelete(adminUserId);
    if (!deletedAdminUser) {
      return res.status(404).json({ error: "Admin user not found" });
    }

    console.log("Admin user deleted successfully");
    res.status(200).json({ message: "Admin user deleted successfully" });
  } catch (error) {
    console.log("Error deleting admin user", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Admin login route
routes.post("/login", async (req, res) => {
  const { mobileno } = req.body;

  console.log("Received mobileno: ", mobileno);

  if (!mobileno) {
    return res.status(400).json({ error: "mobileno is required" });
  }

  try {
    // Check if the user exists in the database
    let user = await AdminUser.findOne({ mobileno });

    if (!user) {
      return res
        .status(404)
        .json({ error: "User with this mobile number does not exist" });
    }

    // Send OTP using OTP-less service
    const response = await sendOTP(
      mobileno,
      null,
      process.env.Channel,
      null,
      null,
      process.env.Expire_OTP_Time,
      process.env.OTP_Length,
      process.env.OTPLESS_CLIENT_ID,
      process.env.OTPLESS_CLIENT_SECRET
    );
    console.log("response:", response);

    user.otpOrderId = response.orderId;
    await user.save();

    res
      .status(200)
      .json({ message: "OTP sent successfully", orderId: response.orderId });
  } catch (error) {
    console.log("Error sending OTP", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

routes.post("/login/resendotp", async (req, res) => {
  const { orderId } = req.body;

  try {
    // Resend OTP using OTP-less service
    const response = await resendOTP(
      orderId,
      process.env.OTPLESS_CLIENT_ID,
      process.env.OTPLESS_CLIENT_SECRET
    );
    console.log("response:", response);

    res.status(200).json({ message: "OTP sent successfully" });
  } catch (error) {
    console.log("Error resending OTP", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

routes.post('/login/verify', async (req, res) => {
  const { mobileno, orderId, otp } = req.body;

  console.log("Received mobileno:", mobileno);
  console.log("Received otp:", otp);

  if (!mobileno) {
    return res.status(400).json({ error: "mobileno is required" });
  }

  if (!otp) {
    return res.status(400).json({ error: "OTP is required" });
  }

  try {
    // Find user by mobile number
    let user = await AdminUser.findOne({ mobileno });

    if (!user) {
      return res
        .status(404)
        .json({ error: "User with this mobile number does not exist" });
    }

    // Verify OTP using OTP-less service
    const response = await verifyOTP(
      null,
      mobileno,
      orderId,
      otp,
      process.env.OTPLESS_CLIENT_ID,
      process.env.OTPLESS_CLIENT_SECRET
    );

    console.log("response:", response);

    // Check if OTP verification was successful
    if (response.isOTPVerified) {
      // Update user verification status in the database
      user.isVerified = true;
      user.otpOrderId = undefined;
      await user.save();

      return res.status(200).json({
        message: "Admin User verified successfully",
        isVerified: user.isVerified,
      });
    } else {
      return res.status(400).json({
        error: "Wrong OTP",
        isOTPVerified: response.isOTPVerified,
        reason: response.reason,
      });
    }
  } catch (error) {
    console.log("Error verifying OTP", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
})

// Forgot password route
routes.post("/forgotpassword", async (req, res) => {
  const { mobileno } = req.body;

  try {
    const adminUser = await AdminUser.findOne({ mobileno });

    if (!adminUser) {
      return res.status(404).json({ error: "Admin user not found" });
    }

    const response = await sendOTP(mobileno, null, process.env.Channel, null, null, process.env.Expire_OTP_Time, process.env.OTP_Length, process.env.OTPLESS_CLIENT_ID, process.env.OTPLESS_CLIENT_SECRET);

    adminUser.otpOrderId = response.orderId;
    await adminUser.save();

    res.status(200).json({ message: "OTP sent successfully" });
  } catch (error) {
    console.log("Error sending OTP", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Verify OTP and change password route
routes.post("/verifyotp", async (req, res) => {
  const { mobileno, orderId, otp, newPassword } = req.body;

  try {
    const adminUser = await AdminUser.findOne({ mobileno });

    if (!adminUser) {
      return res.status(404).json({ error: "Admin user not found" });
    }

    const response = await verifyOTP(null, mobileno, orderId, otp, process.env.OTPLESS_CLIENT_ID, process.env.OTPLESS_CLIENT_SECRET);

    if (response.status !== "approved") {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    adminUser.password = hashedPassword;
    adminUser.otpOrderId = undefined;
    await adminUser.save();

    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    console.log("Error verifying OTP", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = routes;
