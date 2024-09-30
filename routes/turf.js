const express = require("express");
const routes = express.Router();
const Turf = require("../models/turf");
const { S3Client } = require("@aws-sdk/client-s3");
const multer = require("multer");
const multerS3 = require("multer-s3");
require("dotenv").config();
const Booking = require('../models/booking');

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
      cb(null, `turf_images/${Date.now()}_${file.originalname}`);
    },
  }),
});

// Create a new turf
routes.post("/", upload.single("image"), async (req, res) => {
  try {
    const data = req.body;
    if (data.slots) {
      data.slots = JSON.parse(data.slots); // Parse the slots field
    }
    data.images = req.file.location; // Save the image URL from S3
    const newTurf = new Turf(data);
    await newTurf.save();
    res.status(200).send(newTurf);
    console.log("Turf saved successfully");
  } catch (err) {
    console.error(err);
    res.status(400).send(err);
  }
});

// Get all turfs with optional filters
routes.get("/", async (req, res) => {
  try {
    const { location, category, rate } = req.query;

    // Build the filter object
    let filter = {};
    if (location) filter.location = location;
    if (category) filter.category = category;
    if (rate) filter.rating = rate;

    const turfs = await Turf.find(filter);

    if (!turfs || turfs.length === 0) {
      return res
        .status(404)
        .json({ error: "No turfs found matching the criteria" });
    }

    res.status(200).json(turfs);
    console.log("Turf data fetched successfully");
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get a specific turf by ID
routes.get("/:id", async (req, res) => {
  try {
    const turfId = req.params.id;
    const turf = await Turf.findById(turfId);

    if (!turf) {
      return res.status(404).json({ error: "Turf not found" });
    }

    console.log("Turf details fetched successfully");
    res.status(200).json(turf);
  } catch (error) {
    console.log("Error fetching turf details", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get all turfs owned by a specific user
routes.get("/owner/:mobileNo", async (req, res) => {
  try {
    const ownerMobileNo = req.params.mobileNo;
    const turfs = await Turf.find({ ownerMobileNo: ownerMobileNo });

    if (!turfs || turfs.length === 0) {
      console.log("No turfs found for the owner:", ownerMobileNo);
      return res.status(404).json({ error: "No turfs found for the owner" });
    }

    res.status(200).json(turfs);
    console.log("Turfs owned by the user fetched successfully");
  } catch (err) {
    console.error("Error fetching turfs for the owner:", ownerMobileNo, err);
    res.status(500).json({ error: err.message });
  }
});

// Update a turf
routes.put("/id/:id", upload.single("image"), async (req, res) => {
  try {
    const turfId = req.params.id;
    const updates = req.body;
    if (req.file) {
      updates.images = req.file.location; // Set the new image URL from S3
    }
    const options = { new: true };

    const updatedTurf = await Turf.findByIdAndUpdate(turfId, updates, options);
    if (!updatedTurf) {
      return res.status(404).json({ error: "Turf not found" });
    }

    console.log("Turf updated successfully");
    res.status(200).json(updatedTurf);
  } catch (error) {
    console.log("Error updating turf", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Update a turf
routes.patch("/id/:id", upload.single("image"), async (req, res) => {
  try {
    const turfId = req.params.id;
    const updates = req.body;
    if (req.file) {
      updates.images = req.file.location; // Set the new image URL from S3
    }
    const options = { new: true };

    const updatedTurf = await Turf.findByIdAndUpdate(turfId, updates, options);
    if (!updatedTurf) {
      return res.status(404).json({ error: "Turf not found" });
    }

    console.log("Turf updated successfully");
    res.status(200).json(updatedTurf);
  } catch (error) {
    console.log("Error updating turf", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

routes.patch("/id/:id/slots", async (req, res) => {
  try {
    const turfId = req.params.id;
    const { slots } = req.body;
    const options = { new: true };

    const updatedTurf = await Turf.findByIdAndUpdate(turfId, { slots }, options);
    if (!updatedTurf) {
      return res.status(404).json({ error: "Turf not found" });
    }

    console.log("Turf slots updated successfully");
    res.status(200).json(updatedTurf);
  } catch (error) {
    console.log("Error updating turf slots", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get slots of a specific turf
routes.get("/id/:id/slots", async (req, res) => {
  try {
    const turfId = req.params.id;
    const turf = await Turf.findById(turfId, 'slots'); // Only select the slots field
    if (!turf) {
      return res.status(404).json({ error: "Turf not found" });
    }

    console.log("Turf slots retrieved successfully");
    res.status(200).json(turf.slots);
  } catch (error) {
    console.log("Error retrieving turf slots", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Delete a turf
routes.delete("/id/:id", async (req, res) => {
  try {
    const turfId = req.params.id;

    const deletedTurf = await Turf.findByIdAndDelete(turfId);
    if (!deletedTurf) {
      return res.status(404).json({ error: "Turf not found" });
    }

    console.log("Turf deleted successfully");
    res.status(200).json({ message: "Turf deleted successfully" });
  } catch (error) {
    console.log("Error deleting turf", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

routes.get("/availableslot", async (req, res) => {
  try {
    const { date } = req.query;

    const turfs = await Turf.find();
    const bookings = await Booking.find({ date });

    const turfsWithAvailability = turfs.map(turf => {
      const availableSlots = turf.slots.filter(slot => {
        const bookedCourtsCount = bookings.filter(booking => 
          booking.turfId.toString() === turf._id.toString() && booking.slot === slot.time
        ).length;

        return bookedCourtsCount < turf.court.length;
      });

      return {
        ...turf.toObject(),
        slots: availableSlots,
      };
    });

    res.json(turfsWithAvailability);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


module.exports = routes;
