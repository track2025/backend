// controllers/ReviewController.js
const Review = require('../models/Review');
const { getUser } = require('../config/getUser');
const blurDataUrl = require("../config/getBlurDataURL");
const getReviews = async (req, res) => {
    try {
        const reviews = await Review.find({}).populate({
			path: "user",
			select: ["firstName", "lastName", "cover", "orders"],
		});
        res.status(200).json({ success: true, data: reviews });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

const createReview = async (req, res) => {
   try {
        const user = await getUser(req, res);
        const uid = user._id.toString();
        const { rating, review, images } = req.body;

        // Process images to generate blurDataURL
        const updatedImages = await Promise.all(
            images.map(async (image) => {
              const blurDataURL = await blurDataUrl(image.url);
              return { ...image, blurDataURL };
            })
          );

        // Create new review
        const newReview = await Review.create({
            user: uid,
            rating,
            review,
            images: updatedImages
        });

        res.status(201).json({ success: true, data: newReview });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

const getReviewsByAdmin = async (req, res) => {
    try {
        const reviews = await Review.find({});
        res.status(200).json({ success: true, data: reviews });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

const createReviewByAdmin = async (req, res) => {
    try {
        const { review } = req.body;
        const newReview = await Review.create(review);
        res.status(201).json({ success: true, data: newReview });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};
module.exports = {
    getReviews,
    createReview,
    getReviewsByAdmin,
    createReviewByAdmin

}