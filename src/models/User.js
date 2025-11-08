const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'Please enter a firstName'],
    },
    lastName: {
      type: String,
      required: [true, 'Please enter a lastName'],
    },
    email: {
      type: String,
      required: [true, 'Please enter an email'],
      unique: true,
    },
    password: {
      type: String,
      select: false,
      required: [true, 'Please enter a password'],
      minlength: 8,
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
    },
    cover: {
      _id: {
        type: String,
      },
      url: { type: String },
      blurDataURL: {
        type: String,
      },
    },
    wishlist: [
      {
        type: mongoose.Types.ObjectId,
        ref: 'Product',
      },
    ],
    orders: [
      {
        type: mongoose.Types.ObjectId,
        ref: 'Order',
      },
    ],
    shop: { type: mongoose.Types.ObjectId, ref: 'Shop' },
    recentProducts: [
      {
        type: mongoose.Types.ObjectId,
        ref: 'Product',
      },
    ],
    phone: {
      type: String,
      maxlength: [20, 'Phone cannot be more than 20 characters.'],
    },

    status: {
      type: String,
    },
    address: {
      type: String,
    },
    city: {
      type: String,
    },
    zip: {
      type: String,
    },
    country: {
      code: {
        type: String,
        required: true
      },
      name: {
        type: String,
        required: true
      }
    },
    state: {
      type: String,
    },
    about: {
      type: String,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    commission: {
      type: Number,
    },
    role: {
      type: String,
      enum: ['super admin', 'admin', 'user', 'vendor'],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.models.User || mongoose.model('User', UserSchema);
module.exports = User;
