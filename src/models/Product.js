const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
    },
    isFeatured: {
      type: Boolean,
    },
    brand: {
      type: mongoose.Types.ObjectId,
      ref: 'Brand',
    },
    slug: {
      type: String,
      unique: true,
    },
    category: {
      type: mongoose.Types.ObjectId,
      ref: 'Category',
      // required: [true, 'please provide a category id'],
    },
    subCategory: {
      type: mongoose.Types.ObjectId,
      ref: 'SubCategory',
      // required: [true, 'please provide a sub category id'],
    },
    priceSale: {
      type: Number,
      required: [true, 'Sale price is required.'],
    },
    currency: {
      type: String,
      required: [true, 'Currency is required.'],
    },    
    location: {
      type: String
    },
    vehicle_make: {
      type: String
    },
    vehicle_model: {
      type: String
    },
    Multiple: {
      type: Boolean
    },
    dateCaptured: {
      type: Date,
      required: [true, 'Date Captured is required.'],
    },


    shop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shop',
      required: true,
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
    orignalImage: [
      {
        url: {
          type: String,
          required: [true],
        },
        _id: {
          type: String,
          required: [true],
        }
      },
    ]

  },
  { timestamps: true, strict: true }
);

const Product =
  mongoose.models.Product || mongoose.model('Product', productSchema);
module.exports = Product;
