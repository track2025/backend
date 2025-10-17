const mongoose = require("mongoose");

const PhysicalProductSchema = new mongoose.Schema(
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
    },
    isFeatured: {
      type: Boolean,
    },
    brand: {
      type: mongoose.Types.ObjectId,
      ref: "Brand",
    },
    likes: {
      type: Number,
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
      required: [false, "Meta Title is required."],
      maxlength: [100, "Meta Title cannot exceed 100 characters."],
    },
    metaDescription: {
      type: String,
      maxlength: 200,
    },
    slug: {
      type: String,
      unique: true,
      index: true,
    },
    deliveryType: {
      type: String,
      enum: ["physical", "digital"],
      default: "physical",
      required: function () {
        return this.type === "simple";
      },
    },
    downloadLink: {
      type: String,
      required: function () {
        return this.deliveryType === "digital" && this.type === "simple";
      },
    },
    demo: {
      type: String,
    },
    type: {
      type: String,
      enum: ["variable", "simple"],
      required: true,
    },
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
        downloadLink: {
          type: String,
          required: function () {
            return this.deliveryType === "digital" && this.type === "variable";
          },
        },
      },
    ],
    relatedProducts: [
      {
        type: mongoose.Types.ObjectId,
        ref: "Product",
      },
    ],
    category: {
      type: mongoose.Types.ObjectId,
      ref: "Category",
      required: [true, "Please provide a category id"],
      index: true,
    },
    subCategory: {
      type: mongoose.Types.ObjectId,
      ref: "SubCategory",
      required: [true, "Please provide a sub-category id"],
      index: true,
    },
    childCategory: {
      type: mongoose.Types.ObjectId,
      ref: "ChildCategory",
      required: [true, "Please provide a child-category id"],
      index: true,
    },
    gender: {
      type: String,
    },
    tags: [String],
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
    shop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
      index: true,
    },
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

PhysicalProductSchema.index({ sku: 1 });
PhysicalProductSchema.index({ stockQuantity: 1 });

const PhysicalProduct =
  mongoose.models.PhysicalProduct || mongoose.model("PhysicalProduct", PhysicalProductSchema);
module.exports = PhysicalProduct;
