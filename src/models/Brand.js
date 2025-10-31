const mongoose = require("mongoose");

const imageSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: [true, "image-id-required-error"],
  },
  url: {
    type: String,
    required: [true, "image-url-required-error"],
  },
  blurDataURL: {
    type: String,
    required: [true, "image-blur-data-url-required-error"],
  },
});

const faqSchema = new mongoose.Schema({
  question: { type: String, required: true },
  answer: { type: String, required: true },
});

const BrandSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Name is required."] },
    slug: { type: String, unique: true, required: [true, "Slug is required."] },
    description: { type: String },
    fullDescription: { type: String },

    country: { type: String },
    countryCode: { type: String },
    city: { type: String },
    region: { type: String },
    address: { type: String },
    timezone: { type: String },
    length: { type: String },
    corners: { type: String },
    width: { type: String },
    yearOpened: { type: String },
    website: { type: String },
    phone: { type: String },
    email: { type: String },
    status: { type: String, required: [true, "Status is required."] },

    facilities: [{ type: String }],
    keywords: [{ type: String }],
    seoJunk: { type: String },
    faqs: [faqSchema],

    logo: { type: imageSchema, required: true },
    bannerImage: { type: imageSchema, required: true },
    thumbnailImage: { type: imageSchema, required: true },

    totalItems: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

const Brand = mongoose.models.Brand || mongoose.model("Brand", BrandSchema);
module.exports = Brand;
