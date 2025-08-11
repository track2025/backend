const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema(
  {
    paymentMethod: {
      type: String,
      required: [true, 'Payment Method is required.'],
      enum: ['Stripe', 'PayPal', 'COD'],
    },
    orderNo: {
      type: String,
      required: [true, 'Order No is required.'],
    },
    paymentId: {
      type: String,
    },
    subTotal: {
      type: Number,
      required: [true, 'Subtotal is required.'],
    },
    total: {
      type: Number,
      required: [true, 'Total is required.'],
    },
    totalItems: {
      type: Number,
      required: [true, 'Total items is required.'],
    },
    // shipping: {
    //   type: Number,
    //   required: [true, 'ShippingFee is required.'],
    // },
    discount: {
      type: Number,
    },
    currency: {
      type: String,
      required: [true, 'currency is required.'],
    },
    conversionRate: {
      type: Number,
    },
    status: {
      type: String,
      enum: ['pending', 'on the way', 'delivered', 'canceled', 'returned'],
    },
    items: {
      type: Array,
    },
    note: {
      type: String,
    },
    user: {
      _id: {
        type: mongoose.Types.ObjectId, // Use ObjectId type
      },
      firstName: {
        type: String,
        required: [true, 'First name is required.'],
      },
      lastName: {
        type: String,
        required: [true, 'Last name is required.'],
      },
      email: {
        type: String,
        required: [true, 'Email is required.'],
      },
      phone: {
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
        type: String,
      },
      state: {
        type: String,
      },
    },
  },
  {
    timestamps: true,
  }
);

const Order = mongoose.models.Order || mongoose.model('Order', OrderSchema);
module.exports = Order;
