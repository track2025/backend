const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required."],
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PhysicalProduct",
      required: [true, "Product is required."],
    },
    review: {
      type: String,
      required: [true, "Review is required."],
    },
    rating: {
      type: Number,
      required: [true, "Rating is required."],
    },
    isPurchased: {
      type: Boolean,
      required: [true, "isPurchased is required."],
    },
    images: [
      {
        url: {
          type: String,
          required: [true, "Image url is required."],
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const PhysicalReview =
  mongoose.models.PhysicalReview ||
  mongoose.model("PhysicalReview", reviewSchema);

module.exports = PhysicalReview;
