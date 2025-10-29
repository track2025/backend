const express = require("express");
const router = express.Router();
const userPhysicalReview = require("../controllers/user/physical-review-controller");
const verifyToken = require("../config/jwt");



/*
=====================================
Physical Review (User)
=====================================
*/
router.get("/physical-product-reviews/:pid", userPhysicalReview.getReviewsbyPid);
router.post("/physical-product-reviews", verifyToken, userPhysicalReview.createReview);

module.exports = router;
