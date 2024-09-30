const express = require("express");
const router = express.Router();
const Booking = require("../models/booking");
const Turf = require("../models/turf");

router.post("/", async (req, res) => {
  try {
    const { userId, turfId, court, date, slot, totalMembers, remainingMembers, playWithStranger } = req.body;

    // Check if the turf exists
    const turf = await Turf.findById(turfId);
    if (!turf) {
      return res.status(404).json({ message: "Turf not found." });
    }

    // Check if the selected court and slot are available for the given date
    const existingBooking = await Booking.findOne({ turfId, court, date, slot });
    if (existingBooking) {
      return res.status(400).json({ message: "Slot already booked for this court." });
    }

    // Check if the total number of bookings for the slot is less than the number of courts
    const bookingsCount = await Booking.countDocuments({ turfId, date, slot });
    const totalCourts = parseInt(turf.court); // Assuming turf.court is a string representing the number of courts

    if (bookingsCount >= totalCourts) {
      return res.status(400).json({ message: "All courts are booked for this slot." });
    }

    // Create the booking
    const newBooking = new Booking({
      userId,
      turfId,
      turfName: turf.turfname,
      turfImage: turf.images,
      location: turf.location,
      playWithStranger: playWithStranger || false,
      court,
      date,
      slot,
      totalMembers: playWithStranger ? totalMembers : null,
      remainingMembers: playWithStranger ? remainingMembers : null,
      price: turf.slots.find(s => s.time === slot).price,
    });

    await newBooking.save();
    res.status(201).json(newBooking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const bookings = await Booking.find({ userId }).populate('turfId', 'turfName location');

    if (!bookings) {
      return res.status(404).json({ message: "No bookings found for this user." });
    }

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin view all booking by date
router.get("/", async (req, res) => {
  try {
    const { date } = req.query;
    const query = date ? { date: new Date(date) } : {};

    const bookings = await Booking.find(query)
      .limit(25)
      .populate('turfId', 'turfName location');

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/playWithStrangers", async (req, res) => {
  try {
    const bookings = await Booking.find({ playWithStranger: true });//.populate('turfId', 'turfName location');

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/pastBookings", async (req, res) => {
  try {
    const now = new Date();
    const currentTime = now.getTime();
    const bookings = await Booking.find({ date: { $lt: now, $lt: currentTime } })
      .populate('turfId', 'turfName location')
      .sort({ date: -1 }); // Sort by date in descending order to get the most recent bookings first

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/upcomingBookings", async (req, res) => {
  try {
    const now = new Date();
    const bookings = await Booking.find({ date: { $gte: now } })
      .sort({ date: 1 })
      .populate('turfId', 'turfName location');

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/join", async (req, res) => {
  try {
    const { bookingId, userId, name } = req.body;

    // Find the booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found." });
    }

    // Check if playWithStranger is true
    if (!booking.playWithStranger) {
      return res.status(400).json({ message: "This booking does not allow play with strangers." });
    }

    // Check if the turf is full
    if (booking.remainingMembers >= booking.totalMembers) {
      return res.status(400).json({ message: "Members are full for this turf." });
    }

    // Check if the user is already a member of this booking
    const isAlreadyMember = booking.members.some(member => member.userId.toString() === userId);
    if (isAlreadyMember) {
      return res.status(400).json({ message: "User is already a member of this booking." });
    }


    // Add the member to the booking
    booking.members.push({ userId, name });
    booking.remainingMembers += 1;

    await booking.save();
    res.status(201).json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;