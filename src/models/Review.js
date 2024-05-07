// models/Review.js
const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    rating: {
        type: Number,
        required: true
    },
    review: {
        type: String,
        required: true
  },
  designation: {
    type: String,
    required: true
},
    images: [
        {
          url: {
            type: String,
            required: [true],
          },
          _id: {
            type: String,
            required: [true],
          },
          blurDataURL: {
            type: String,
            required: [true, 'image-blur-data-url-required-error'],
          },
        },
      ],
    createdAt: {
        type: Date,
        default: Date.now
    }
});


// Check if the model is already defined
const Review = mongoose.models.Review || mongoose.model('Review', ReviewSchema);

module.exports = Review;