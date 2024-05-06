// routes/ReviewRoutes.js
const express = require('express');
const router = express.Router();
const ReviewController = require('../controllers/review');
const verifyToken = require("../config/jwt");

router.get('/app-reviews', verifyToken,ReviewController.getReviews);
router.post('/app-reviews',verifyToken, ReviewController.createReview);
router.get('/admin/app-reviews',verifyToken, ReviewController.getReviewsByAdmin);
router.post('/admin/app-reviews',verifyToken, ReviewController.createReviewByAdmin);

module.exports = router;
