const mongoose = require("mongoose");

const physicalProductSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required."],
      maxlength: [100, "Name cannot exceed 100 characters."],
      index: true,
    },

    status: {
      type: String,
      enum: ["published", "draft", "pending"],
      default: "draft",
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    brand: {
      type: mongoose.Types.ObjectId,
      ref: "PhysicalBrand",
    },
    likes: {
      type: Number,
      default: 0,
    },
    description: {
      type: String,
      required: [true, "Description is required."],
      maxlength: [500, "Description cannot exceed 500 characters."],
    },
    content: {
      type: String,
    },
    metaTitle: {
      type: String,
      required: [true, "Meta Title is required."],
      maxlength: [100, "Meta Title cannot exceed 100 characters."],
    },
    metaDescription: {
      type: String,
      maxlength: [200, "Meta Title cannot exceed 200 characters."],
    },
    slug: {
      type: String,
      unique: true,
      index: true,
    },
    deliveryType: {
      type: String,
      enum: ["physical"],
      default: "physical",
    },
    demo: {
      type: String,
    },

    type: {
      type: String,
      enum: ["variable", "simple"],
      required: true,
    },

    // Variants for variable products
    variants: [
      {
        variant: {
          type: String,
          required: function () {
            return this.type === "variable";
          },
        },
        name: {
          type: String,
          required: function () {
            return this.type === "variable";
          },
        },
        price: {
          type: Number,
          required: function () {
            return this.type === "variable";
          },
        },
        salePrice: {
          type: Number,
          required: function () {
            return this.type === "variable";
          },
        },
        sku: {
          type: String,
          required: function () {
            return this.type === "variable";
          },
        },
        stockQuantity: {
          type: Number,
          required: function () {
            return this.type === "variable";
          },
        },
        images: {
          type: [
            {
              _id: {
                type: String,
                required: [true, "Image id is required."],
              },
              url: {
                type: String,
                required: [true, "Image url is required."],
              },
            },
          ],
          required: function () {
            return this.type === "variable";
          },
        },
      },
    ],

    relatedProducts: [
      {
        type: mongoose.Types.ObjectId,
        ref: "PhysicalProduct",
      },
    ],

    category: {
      type: mongoose.Types.ObjectId,
      ref: "PhysicalCategory",
      required: [true, "Please provide a category id"],
      index: true,
    },
    subCategory: {
      type: mongoose.Types.ObjectId,
      ref: "PhysicalSubCategory",
      required: [true, "Please provide a sub-category id"],
      index: true,
    },

    tags: [String],

    // Simple product fields
    sku: {
      type: String,
      required: function () {
        return this.type === "simple";
      },
    },
    price: {
      type: Number,
      required: function () {
        return this.type === "simple";
      },
    },
    salePrice: {
      type: Number,
      required: function () {
        return this.type === "simple";
      },
    },
    oldSalePrice: {
      type: Number,
    },
    stockQuantity: {
      type: Number,
      required: function () {
        return this.type === "simple";
      },
    },
    sold: {
      type: Number,
      default: 0,
    },
    reviews: [
      {
        type: mongoose.Types.ObjectId,
        ref: "Review",
      },
    ],

    // Physical product dimensions
    width: {
      type: String,
    },
    length: {
      type: String,
    },
    height: {
      type: String,
    },

    images: {
      type: [
        {
          _id: {
            type: String,
            required: [true, "Image id is required."],
          },
          url: {
            type: String,
            required: [true, "Image url is required."],
          },
        },
      ],
    },
  },
  { timestamps: true, strict: true }
);

// Indexes
physicalProductSchema.index({ sku: 1 });
physicalProductSchema.index({ stockQuantity: 1 });

const PhysicalProduct =
  mongoose.models.PhysicalProduct ||
  mongoose.model("PhysicalProduct", physicalProductSchema);

module.exports = PhysicalProduct;
