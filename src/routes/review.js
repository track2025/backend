const express = require("express");
const router = express.Router();
const reviewRoutes = require("../controllers/review");
// Import verifyToken function
const verifyToken = require("../config/jwt");
//user routes
router.get("/reviews/:pid", reviewRoutes.getReviewsbyPid);
router.post("/reviews", verifyToken, reviewRoutes.createReview);

//admin routes
router.get("/admin/reviews", verifyToken, reviewRoutes.getReviewsByAdmin);
router.post("/admin/review", verifyToken, reviewRoutes.createReviewByAdmin);

module.exports = router;
