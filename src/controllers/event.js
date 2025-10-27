const Events = require("../models/Event");
const getBlurDataURL = require("../config/getBlurDataURL");
const { singleFileDelete } = require("../config/uploader");

const getAllEvents = async (req, res) => {
  try {
    const events = await Events.find().sort({
      createdAt: -1,
    });
    res.status(201).json({
      success: true,
      data: events,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createEventByAdmin = async (req, res) => {
  try {
    const { image, thumbnailImage, ...others } = req.body;

    // Validate images
    if (!image?.url || !thumbnailImage?.url) {
      return res.status(400).json({
        success: false,
        message: "Both image and thumbnail image are required",
      });
    }

    // Generate blurDataURL for both images
    const [imageBlur, thumbBlur] = await Promise.all([
      getBlurDataURL(image.url),
      getBlurDataURL(thumbnailImage.url),
    ]);

    // Create new event
    await Events.create({
      ...others,
      image: {
        ...image,
        blurDataURL: imageBlur,
      },
      thumbnailImage: {
        ...thumbnailImage,
        blurDataURL: thumbBlur,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Event Created Successfully",
    });
  } catch (error) {
    console.error("Create Event Error:", error);
    return res.status(400).json({
      success: false,
      message: error.message || "Something went wrong while creating event",
    });
  }
};

module.exports = {
  getAllEvents,
  createEventByAdmin,
};
