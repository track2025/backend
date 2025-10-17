const mongoose = require("mongoose");

const PhysicalSubCategorySchema = new mongoose.Schema(
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
      required: [true, "Sub-category name is required."],
      maxlength: [100, "Sub-category name cannot exceed 100 characters."],
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
    parentCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PhysicalCategory",
      required: true,
      index: true,
    },
    childCategories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "PhysicalChildCategory",
      },
    ],
  },
  { timestamps: true }
);

const PhysicalSubCategory =
  mongoose.models.PhysicalSubCategory ||
  mongoose.model("PhysicalSubCategory", PhysicalSubCategorySchema);

module.exports = PhysicalSubCategory;
