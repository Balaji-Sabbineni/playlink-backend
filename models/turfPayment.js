const mongoose = require('mongoose');
const moment = require('moment-timezone');

const TurfPaymentSchema = new mongoose.Schema({
  turfId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Turf',
    required: true
  },
  ownerMobileNo: {
    type: String,
    required: true,
  },
  paymentId: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const TurfPayment = mongoose.model('TurfPayment', TurfPaymentSchema);

module.exports = TurfPayment;