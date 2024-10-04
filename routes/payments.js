const moment = require('moment-timezone');
const express = require("express");
const routes = express.Router();
const mongoose = require("mongoose");
const Razorpay = require("razorpay");
const crypto = require("crypto"); // Importing the crypto module
const Payment = require("./../models/payments");
const Turf = require('../models/turf');
const TurfPayment = require('../models/turfPayment');

// Configure Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create a Razorpay order
routes.post('/createOrder', async (req, res) => {
  const { amount, turfId, userId } = req.body;
  // Find the turf to get the ownerId
  const turf = await Turf.findById(turfId);
  if (!turf) {
    return res.status(404).json({ message: "Turf not found." });
  }

  const options = {
    amount: amount,
    currency: 'INR',
    receipt: `receipt_order_${Date.now()}`,
    notes: {
      turfId: turfId,
      ownerMobileNo: turf.ownerMobileNo,
      userId: userId
    }
  };

  try {
    const order = await razorpay.orders.create(options);
    res.status(201).json(order);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Verify Razorpay payment
routes.post('/verifyPayment', async (req, res) => {
  const secret = process.env.RAZORPAY_KEY_SECRET;

  const shasum = crypto.createHmac('sha256', secret);
  shasum.update(req.body.razorpay_order_id + "|" + req.body.razorpay_payment_id);
  const digest = shasum.digest('hex');

  if (digest === req.body.razorpay_signature) {
    const { userId, amount, turfId } = req.body;

    // Find the turf to get ownerId
    const turf = await Turf.findById(turfId);
    if (!turf) {
      return res.status(404).json({ message: "Turf not found." });
    }

    const payment = new Payment({
      userId: userId,
      amount: amount,
      paymentId: req.body.razorpay_payment_id,
      orderId: req.body.razorpay_order_id,
      ownerMobileNo: turf.ownerMobileNo,
      turfId: turfId
    });

    try {
      const savedPayment = await payment.save();
      res.json({ status: 'success', payment: savedPayment });
    } catch (err) {
      res.status(500).send(err);
    }
  } else {
    res.status(400).json({ status: 'failure' });
  }
});

routes.post('/turf', async (req, res) => {
  const { turfId, paymentId, amount } = req.body;

  if(!turfId||  !paymentId || !amount){
    return res.status(400).json({message: "turfId or paymentId or amount is missing"});
  }

  try {
    const turf = await Turf.findById(turfId);
    const newPayment = new TurfPayment({
      turfId,
      ownerMobileNo: turf.ownerMobileNo,
      paymentId,
      amount
    });

    await newPayment.save();

    res.status(201).json({data: newPayment });
  } catch (error) {
    console.error('Error saving turf payment:', error);
    res.status(500).json({ status: 'failure', error: 'Internal Server Error' });
  }
});

// GET /earnings API
routes.post('/earnings', async (req, res) => {
  try {
    const { ownerMobileNo, interval } = req.body;

    if (!ownerMobileNo || !interval) {
      return res.status(400).json({ error: 'ownerMobileNo and interval are required.' });
    }

    const timezone = 'Asia/Kolkata';
    let dateRanges = [];
    const today = moment().tz(timezone).endOf('day');

    switch (interval) {
      case 'day':
        for (let i = 0; i < 7; i++) {
          dateRanges.push({
            display: today.clone().subtract(i, 'days').format('DD'), // Show date
            start: today.clone().subtract(i, 'days').startOf('day').toDate(),
            end: today.clone().subtract(i, 'days').endOf('day').toDate()
          });
        }
        break;

      case 'week':
        for (let i = 0; i < 4; i++) {
          dateRanges.push({
            display: `week${i + 1-5}`, // Show week number
            start: today.clone().subtract(i, 'weeks').startOf('week').toDate(),
            end: today.clone().subtract(i, 'weeks').endOf('week').toDate()
          });
        }
        break;

      case 'month':
        for (let i = 0; i < 6; i++) {
          dateRanges.push({
            display: today.clone().subtract(i, 'months').format('MMMM'), // Show month name
            start: today.clone().subtract(i, 'months').startOf('month').toDate(),
            end: today.clone().subtract(i, 'months').endOf('month').toDate()
          });
        }
        break;

      case 'year':
        for (let i = 0; i < 4; i++) {
          dateRanges.push({
            display: today.clone().subtract(i, 'years').format('YYYY'), // Show year number
            start: today.clone().subtract(i, 'years').startOf('year').toDate(),
            end: today.clone().subtract(i, 'years').endOf('year').toDate()
          });
        }
        break;

      default:
        return res.status(400).json({ error: 'Invalid interval. Please use day, week, month, or year.' });
    }

    let results = [];
    for (let range of dateRanges) {
      const payments = await TurfPayment.aggregate([
        {
          $match: {
            ownerMobileNo: ownerMobileNo,
            createdAt: {
              $gte: range.start,
              $lte: range.end
            }
          }
        },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: "$amount" }
          }
        }
      ]);

      results.push({
        interval: range.display,
        totalAmount: payments.length > 0 ? payments[0].totalAmount : 0
      });
    }
    res.status(200).json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

routes.post('/week', async (req, res) => {
  try {
    const { ownerMobileNo } = req.body;

    if (!ownerMobileNo) {
      return res.status(400).json({ error: 'ownerMobileNo is required.' });
    }

    const timezone = 'Asia/Kolkata';
    const today = moment().tz(timezone).endOf('day');
    let totalSum = 0;

    // Define the date ranges for the last 4 weeks
    let dateRanges = [];
    for (let i = 0; i < 4; i++) {
      dateRanges.push({
        start: today.clone().subtract(i, 'weeks').startOf('week').toDate(),
        end: today.clone().subtract(i, 'weeks').endOf('week').toDate()
      });
    }

    // Fetch and sum the totalAmount values from the database for each date range
    for (let range of dateRanges) {
      const payments = await TurfPayment.aggregate([
        {
          $match: {
            ownerMobileNo: ownerMobileNo,
            createdAt: {
              $gte: range.start,
              $lte: range.end
            }
          }
        },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: "$amount" }
          }
        }
      ]);

      if (payments.length > 0) {
        totalSum += payments[0].totalAmount;
      }
    }

    res.status(200).json({ amount:totalSum });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});


routes.get('/interval', async (req, res) => {
  try {
    const { ownerMobileNo, interval } = req.body;

    // Validate the inputs
    if (!ownerMobileNo || !interval) {
      return res.status(400).json({ error: 'ownerMobileNo and interval are required' });
    }

    // Set timezone to 'Asia/Kolkata'
    const timezone = 'Asia/Kolkata';
    const currentDate = moment().tz(timezone).endOf('day').toDate(); // Set to the end of today
    let startDate;

    // Define the startDate based on the interval
    switch (interval) {
      case 'day':
        startDate = moment().tz(timezone).startOf('day').toDate();
        break;
      case 'week':
        startDate = moment().tz(timezone).startOf('week').toDate();
        break;
      case 'month':
        startDate = moment().tz(timezone).startOf('month').toDate();
        break;
      case 'year':
        startDate = moment().tz(timezone).startOf('year').toDate();
        break;
      default:
        return res.status(400).json({ error: 'Invalid interval. Use day, week, month, or year.' });
    }

    // Fetch all payments within the specified date range
    const payments = await TurfPayment.find({
      ownerMobileNo,
      createdAt: { $gte: startDate, $lte: currentDate }
    }).sort({ createdAt: -1 }); // Sort by creation date in descending order

    // Return the list of payments
    res.status(200).json(payments);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred' });
  }
});

routes.get('/payment-success/:paymentId', async (req, res) => {
    const { slot, courtno, playWithStrangers } = req.body;
    const paymentId = req.params.paymentId;

    if (!paymentId) {
      return res.status(400).json({ error: 'paymentId is required' });
    }
    if(!slot || !courtno || !playWithStrangers){
      return res.status(400).json({message: 'slot, courtno, playwithstrangers are required'});
    }

    try {
      const payment = await TurfPayment.findOne({ paymentId });

      if (!payment) {
        return res.status(404).json({ error: 'Payment not found' });
      }

      const turf = await Turf.findById(payment.turfId);

      if (!turf) {
        return res.status(404).json({ error: 'Turf not found' });
      }

      res.status(200).json({
          userId: payment.userId,
          amount: payment.amount,
          turfName: turf.name,
          turfLocation: turf.location,
          bookingDate: moment(payment.createdAt).format('DD-MM-YYYY'), // Format date as DD-MM-YYYY
          slot,
          courtno,
          playWithStrangers,
      });
    } catch (error) {
      console.error('Error fetching payment details:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = routes;
