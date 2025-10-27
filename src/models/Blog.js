const mongoose = require("mongoose");

const ImageSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: [true, "Image ID is required."],
  },
  url: {
    type: String,
    required: [true, "Image URL is required."],
  },
  blurDataURL: {
    type: String,
    required: [true, "Image blur data URL is required."],
  },
});

const BlogSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      unique: true,
      required: [true, "Blog slug is required."],
    },
    title: {
      type: String,
      required: [true, "Blog title is required."],
    },
    metaTitle: {
      type: String,
      required: [true, "Meta title is required."],
    },
    metaDescription: {
      type: String,
      required: [true, "Meta description is required."],
    },
    excerpt: {
      type: String,
      required: [true, "Excerpt is required."],
    },
    featuredImage: {
      type: ImageSchema,
      required: [true, "Featured image URL is required."],
    },
    heroImage: {
      type: ImageSchema,
      required: [true, "Hero image URL is required."],
    },
    author: {
      type: String,
      required: [true, "Author name is required."],
    },

    category: {
      type: String,
    },
    publishedDate: {
      type: String,
    },
    readTime: {
      type: String,
    },
    content: {
      type: String,
      required: [true, "Blog content is required."],
    },
    featured: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "published",
    },
  },
  {
    timestamps: true,
  }
);

const Blog = mongoose.models.Blog || mongoose.model("Blog", BlogSchema);
module.exports = Blog;
