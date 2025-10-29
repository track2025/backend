const Events = require("../models/Event");
const getBlurDataURL = require("../config/getBlurDataURL");
const { singleFileDelete } = require("../config/uploader");

const getAllEvents = async (req, res) => {
  try {
    const {
      limit = 10,
      page = 1,
      search = "",
      status,
      category,
      type,
      featured,
    } = req.query;

    const skip = parseInt(limit);
    const pageNumber = parseInt(page) || 1;

    // Build dynamic search filter
    let filter = {
      $or: [{ title: { $regex: search, $options: "i" } }],
    };

    // Count total matching documents
    const totalEvents = await Events.countDocuments(filter);

    // Fetch paginated events
    const events = await Events.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip * (pageNumber - 1))
      .limit(skip);

    res.status(200).json({
      success: true,
      data: events,
      total: totalEvents,
      count: Math.ceil(totalEvents / skip),
      currentPage: pageNumber,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
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

const getEventBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const event = await Events.findOne({ slug });

    if (!event) {
      return res.status(404).json({ message: "Event Not Found" });
    }

    return res.status(201).json({
      success: true,
      data: event,
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const updateEventBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const { slug: skipSlug, image, thumbnailImage, ...others } = req.body;

    // --- Process main image ---
    if (image && !image.blurDataURL) {
      image.blurDataURL = await getBlurDataURL(image.url);
    }

    // --- Process thumbnail image ---
    if (thumbnailImage && !thumbnailImage.blurDataURL) {
      thumbnailImage.blurDataURL = await getBlurDataURL(thumbnailImage.url);
    }

    // --- Update the event ---
    await Events.findOneAndUpdate(
      { slug },
      {
        ...others,
        image: image ? { ...image } : undefined,
        thumbnailImage: thumbnailImage ? { ...thumbnailImage } : undefined,
      },
      { new: true, runValidators: true }
    );

    res.status(201).json({ success: true, message: "Event Updated" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const deleteEventBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const brand = await Events.findOne({ slug });

    if (!brand) {
      return res.status(404).json({ message: "Event Not Found" });
    }

    await Events.deleteOne({ slug });

    res.status(201).json({ success: true, message: "Event Deleted" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};


// Gabriel 
const fetchAllEvents =  async (req, res) => {
  try {
    let events  =  await Events.find()

    res.status(200).send(events)
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}


module.exports = {
  getAllEvents,
  createEventByAdmin,
  getEventBySlug,
  updateEventBySlug,
  deleteEventBySlug,
  fetchAllEvents,
};
