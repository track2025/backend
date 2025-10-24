const express = require("express");
const router = express.Router();
const event = require("../controllers/event");

// Import verifyToken function
const verifyToken = require("../config/jwt");

// admin routes

router.get("/admin/events", verifyToken, event.getAllEvents);

module.exports = router;
