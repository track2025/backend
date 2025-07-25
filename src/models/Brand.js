const mongoose = require('mongoose');

const BrandSchema = new mongoose.Schema(
  {
    logo: {
      _id: {
        type: String,
        required: [true, 'image-id-required-error'],
      },
      url: {
        type: String,
        required: [true, 'image-url-required-error'],
      },
      blurDataURL: {
        type: String,
        required: [true, 'image-blur-data-url-required-error'],
      },
    },
    name: {
      type: String,
      required: [true, 'Name is required.'],
    },
    description: {
      type: String,
    },
    slug: {
      type: String,
      unique: true,
      required: [true, 'Slug is required.'],
    },
    status: {
      type: String,
      required: [true, 'Status is required.'],
    },
  },
  {
    timestamps: true,
  }
);

const Brand = mongoose.models.Brand || mongoose.model('Brand', BrandSchema);
module.exports = Brand;
