const mongoose = require("mongoose");

const ImageSchema = new mongoose.Schema({
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

const EventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Event title is required."],
    },
    slug: {
      type: String,
      unique: true,
      required: [true, "Event slug is required."],
    },
    trackId: {
      type: String,
      required: [true, "Track ID is required."],
    },
    trackName: {
      type: String,
      required: [true, "Track name is required."],
    },
    trackSlug: {
      type: String,
      required: [true, "Track slug is required."],
    },
    country: {
      type: String,
      required: [true, "Country is required."],
    },
    content: {
      type: String,
    },
    countryCode: {
      type: String,
    },
    countryCode: {
      type: String,
    },
    city: {
      type: String,
    },
    date: {
      type: String,
      required: [true, "Event date is required."],
    },
    startTime: {
      type: String,
      required: [true, "Start time is required."],
    },
    endTime: {
      type: String,
      required: [true, "End time is required."],
    },
    type: {
      type: String,
    },
    category: {
      type: String,
      required: [true, "Category is required."],
    },
    description: {
      type: String,
      required: [true, "Short description is required."],
    },
    fullDescription: {
      type: String,
    },
    image: {
      type: ImageSchema,
      required: [true, "Event image is required."],
    },
    thumbnailImage: {
      type: ImageSchema,
      required: [true, "Event thumbnail image is required."],
    },
    status: {
      type: String,
      required: [true, "Event status is required."],
    },
    featured: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Event = mongoose.models.Event || mongoose.model("Event", EventSchema);
module.exports = Event;
