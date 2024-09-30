const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  turfId: { type: mongoose.Schema.Types.ObjectId, ref: "Turf", required: true },
  turfName: { type: String, required: true },
  turfImage: { type: String, required: true },
  location: { type: String, required: true },
  playWithStranger: { type: Boolean, default: false },
  court: { type: String, required: true },
  date: { type: Date, required: true },
  slot: { type: String, required: true },
  totalMembers: { type: Number, default: 0 },
  remainingMembers: { type: Number, default: 0 },
  price: { type: Number, required: true },
  members: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      name: { type: String },
    },
  ],
});

const Booking = mongoose.model("Booking", bookingSchema);
module.exports = Booking;
