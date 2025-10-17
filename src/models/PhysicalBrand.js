const mongoose = require("mongoose");

const PhysicalBrandSchema = new mongoose.Schema(
  {
    logo: {
      _id: {
        type: String,
        required: [true, "Logo image ID is required."],
      },
      url: {
        type: String,
        required: [true, "Logo image URL is required."],
      },
    },
    name: {
      type: String,
      required: [true, "Brand name is required."],
      maxlength: [100, "Brand name cannot exceed 100 characters."],
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
      required: [true, "Slug is required."],
      index: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const PhysicalBrand =
  mongoose.models.PhysicalBrand || mongoose.model("PhysicalBrand", PhysicalBrandSchema);

module.exports = PhysicalBrand;
