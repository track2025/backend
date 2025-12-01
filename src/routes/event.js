const express = require("express");
const router = express.Router();
const event = require("../controllers/event");

// Import verifyToken function
const verifyToken = require("../config/jwt");

// admin routes

router.get("/admin/events", verifyToken, event.getAllEvents);
router.post("/admin/events", verifyToken, event.createEventByAdmin);
router.get("/admin/events/:slug", verifyToken, event.getEventBySlug);
router.put("/admin/events/:slug", verifyToken, event.updateEventBySlug);
router.delete("/admin/events/:slug", verifyToken, event.deleteEventBySlug);
router.put("/admin/events/:slug/toggle-status", verifyToken, event.updateActiveStatus);

// Gabriel codes
router.get("/all-events", event.fetchAllEvents);


module.exports = router;
