const mongoose = require("mongoose");

const PhysicalChildCategorySchema = new mongoose.Schema(
  {
    cover: {
      _id: {
        type: String,
        required: [true, "Cover image ID is required."],
      },
      url: {
        type: String,
        required: [true, "Cover image URL is required."],
      },
    },
    name: {
      type: String,
      required: [true, "Child category name is required."],
      maxlength: [100, "Child category name cannot exceed 100 characters."],
      index: true,
    },
    metaTitle: {
      type: String,
      required: [false, "Meta Title is required."],
      maxlength: [100, "Meta Title cannot exceed 100 characters."],
    },
    description: {
      type: String,
      required: [true, "Description is required."],
      maxlength: [500, "Description cannot exceed 500 characters."],
    },
    metaDescription: {
      type: String,
      required: [false, "Meta Description is required."],
      maxlength: [200, "Meta Description cannot exceed 200 characters."],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
      required: true,
    },
    subCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PhysicalSubCategory",
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

const PhysicalChildCategory =
  mongoose.models.PhysicalChildCategory ||
  mongoose.model("PhysicalChildCategory", PhysicalChildCategorySchema);

module.exports = PhysicalChildCategory;
