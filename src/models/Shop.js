const { toNumber } = require('lodash');
const mongoose = require('mongoose');

const ShopSchema = new mongoose.Schema(
  {
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
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
    cover: {
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
    username: {
      type: String,
      required: [true, 'A unique Username is required.'],
      unique: true,
      maxlength: [30, 'Username cannot exceed 30 characters.'],
    },
    description: {
      type: String,
      required: [true, 'Description is required.'],
      maxlength: [500, 'Description cannot exceed 500 characters.'],
    },
    title: {
      type: String,
      maxlength: [40, 'Title cannot exceed 40 characters.'],
    },

   
    slug: {
      type: String,
      unique: true,
      required: true,
    },
    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    phone: {
      type: String,
      unique: true,
      required: true,
    },
    defaultCurrency: {
      type: String,
      required: true,
    },
    defaultPrice: {
      type: Number ,
      required: true,
    },
    approved: {
      type: Boolean,
      required: true,
      default: false,
    },
    approvedAt: {
      type: Date,
    },

    website: {
      type: String,
    },
    status: {
      type: String,
      enum: [
        'approved',
        'pending',
        'in review',
        'action required',
        'blocked',
        'rejected',
      ],
      required: true,
    },
    message: {
      type: String,
    },
    products: [
      {
        type: mongoose.Types.ObjectId,
        ref: 'Product',
      },
    ],
    paymentInfo: {
      holderName: {
        type: String,
        required: true,
      },
      holderEmail: {
        type: String,
        required: true,
      },
      bankName: {
        type: String,
        // required: true,
      },
      AccountNo: {
        type: Number,
        // required: true,
      },
    },
    address: {
      country: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      streetAddress: { type: String, required: true },
    },
  },
  {
    timestamps: true,
  }
);

const Shop = mongoose.models.Shop || mongoose.model('Shop', ShopSchema);
module.exports = Shop;
