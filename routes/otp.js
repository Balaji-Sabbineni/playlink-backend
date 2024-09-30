const express = require("express");
const routes = express.Router();
const User = require("../models/users");
const { sendOTP, resendOTP, verifyOTP } = require("otpless-node-js-auth-sdk");
const jwt = require("jsonwebtoken");
require("dotenv").config();

routes.post("/sendotp", async (req, res) => {
  const mobileno = req.body.mobileno;

  console.log("Received mobileno:", mobileno);

  if (!mobileno) {
    return res.status(400).json({ error: "mobileno is required" });
  }

  try {
    // Check if the user exists in the database
    let user = await User.findOne({ mobileno });

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

routes.post("/resendotp", async (req, res) => {
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


routes.post("/verify", async (req, res) => {
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
    let user = await User.findOne({ mobileno });

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

    
    // Update user verification status in the database
    user.isVerified = true;
    user.otpOrderId = undefined;
    await user.save();
    
    // Check if OTP verification was successful
    if (response.isOTPVerified) {
      // Generate JWT token
      const token = jwt.sign(
        { userId: user._id }, 
        process.env.JWT_SECRET
        );
        // console.log(token);
      return res
        .status(200)
        .json({ message: "User verified successfully", token });
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
});

module.exports = routes;
