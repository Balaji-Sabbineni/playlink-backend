require("dotenv").config();
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const db = require("./db");
const morgan = require('morgan');
const http = require('http');

// Middleware to parse JSON
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
morgan.token('custom', (req, res) => {
  return `${req.method} ${req.originalUrl} - ${res.statusCode} ${http.STATUS_CODES[res.statusCode]} - ${res.get('Content-Length') || 0} bytes`;
});
app.use(morgan(':custom'));

// Default Routes
app.get('/', function (req, res) {
  res.status(200).json({ message: "All is well" });
});

app.get("/health", function (req, res) {
  res.status(200).send("Hello, Everything is working fine!");
});

// Server PORT
const PORT = process.env.PORT || 3000;

// Imports the Routes Files
const adminuser = require("./routes/admin");
const userRoutes = require("./routes/users");
const turfRoutes = require("./routes/turf");
const bookRoutes = require("./routes/booking");
const communityRoutes = require("./routes/community");
const otpRoutes = require("./routes/otp");
const paymentRoutes = require('./routes/payments');

// Use the routes
app.use("/admin", adminuser);
app.use("/users", userRoutes);
app.use("/turf", turfRoutes);
app.use("/booking", bookRoutes);
app.use("/community-group", communityRoutes);
app.use("/", otpRoutes);
app.use('/payments', paymentRoutes);

// Server Start
app.listen(PORT, () => console.log(`Server Started at PORT:${PORT}`));
