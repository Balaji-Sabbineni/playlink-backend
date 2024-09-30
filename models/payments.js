const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
    userId: String,
    amount: Number,
    paymentId: String,
    orderId: String,
    paymentDate: { type: Date, default: Date.now }
  });
  
  const Payment = mongoose.model('Payment', paymentSchema);
  module.exports = Payment;