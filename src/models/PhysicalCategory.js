const mongoose = require("mongoose");

const PhysicalCategorySchema = new mongoose.Schema(
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
      required: [true, "Category name is required."],
      maxlength: [100, "Category name cannot exceed 100 characters."],
      index: true,
    },
    metaTitle: {
      type: String,
      required: [false, "Meta title is required."],
      maxlength: [100, "Meta title cannot exceed 100 characters."],
    },
    description: {
      type: String,
      required: [true, "Description is required."],
      maxlength: [500, "Description cannot exceed 500 characters."],
    },
    metaDescription: {
      type: String,
      required: [false, "Meta description is required."],
      maxlength: [200, "Meta description cannot exceed 200 characters."],
    },
    slug: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
      required: true,
    },

    subCategories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SubCategory",
      },
    ],
  },
  {
    timestamps: true,
  }
);

const PhysicalCategory =
  mongoose.models.PhysicalCategory || mongoose.model("PhysicalCategory", PhysicalCategorySchema);

module.exports = PhysicalCategory;
