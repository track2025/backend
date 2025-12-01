const getBlurDataURL = require("../config/getBlurDataURL");
const Slide = require("../models/Slide");

// Fetch all slides (Admin)
const getSlidesByAdmin = async (req, res) => {
  try {

    const {search} = req.query;
    console.log("Fetching slides for admin", req.query);
    const slides = await Slide.find().sort({ createdAt: -1 });

    if(search){
      const filteredSlides = slides.filter(slide => slide.title.toLowerCase().includes(search.toLowerCase()));
      return res.status(200).json({
        success: true,
        data: filteredSlides,
        message: "Slides fetched successfully.",
      });
    }
    

    return res.status(200).json({
      success: true,
      data: slides,
      message: "Slides fetched successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch slides.",
    });
  }
};

// Create a new slide
const createSlide = async (req, res) => {
  try {
    const { images = [], ...body } = req.body;

    if (!images.length) {
      return res.status(400).json({
        success: false,
        message: "At least one image is required.",
      });
    }

    const updatedImages = await Promise.all(
      images.map(async (image) => ({
        ...image,
        blurDataURL: await getBlurDataURL(image.url),
      }))
    );

    const count = await Slide.countDocuments();

    await Slide.create({
      ...body,
      images: updatedImages,
      slug: `${body.title?.toLowerCase().replace(/\s+/g, "")}-${Math.floor(
        100 + Math.random() * 900
      )}`,
      order: count + 1,
    });

    return res.status(201).json({
      success: true,
      message: "Slide created successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create slide.",
    });
  }
};

// Fetch a single slide by slug (Admin)
const getSlideByAdmin = async (req, res) => {
  try {
    const { slug } = req.params;
    const slide = await Slide.findOne({ slug });

    if (!slide) {
      return res.status(404).json({
        success: false,
        message: "Slide not found.",
      });
    }

    return res.status(200).json({ success: true, data: slide });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch slide.",
    });
  }
};

// Update a slide by slug
const updateSlideBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const { images = [], ...body } = req.body;

    const updatedImages = await Promise.all(
      images.map(async (image) => ({
        ...image,
        blurDataURL: await getBlurDataURL(image.url),
      }))
    );

    const updatedSlide = await Slide.findOneAndUpdate(
      { slug },
      { ...body, images: updatedImages },
      { new: true, runValidators: true }
    );

    if (!updatedSlide) {
      return res.status(404).json({
        success: false,
        message: "Slide not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Slide updated successfully.",
      data: updatedSlide,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update slide.",
    });
  }
};

// Delete a slide by slug
const deleteSlideBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const deletedSlide = await Slide.findOneAndDelete({ slug });

    if (!deletedSlide) {
      return res.status(404).json({
        success: false,
        message: "Slide not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Slide deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete slide.",
    });
  }
};

// Toggle active/inactive status
const updateSlideActiveInactiveByAdmin = async (req, res) => {
  try {
    const { slug } = req.params;
    const { isActive } = req.body;

    const updated = await Slide.findOneAndUpdate(
      { slug },
      { $set: { isActive } },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Slide not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: updated,
      message: isActive
        ? "Slide activated successfully."
        : "Slide deactivated successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update slide status.",
    });
  }
};

module.exports = {
  getSlidesByAdmin,
  createSlide,
  getSlideByAdmin,
  updateSlideBySlug,
  deleteSlideBySlug,
  updateSlideActiveInactiveByAdmin,
};
