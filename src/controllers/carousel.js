const mongoose = require("mongoose");
const Slide = require("../models/Slide");
const { extractPathFromUrl } = require("../utils/heroCarouselHelpers");


const getCarousel = async (req, res) => {
  try {
    const { sort = "order", order = "asc", isActive, search } = req.query;

    // Build query
    const query = {};

    if (isActive !== undefined) {
      query.isActive = isActive === "true";
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { highlight: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // Sort validation
    const validSortFields = ["order", "title", "createdAt", "updatedAt"];
    const sortField = validSortFields.includes(sort) ? sort : "order";
    const sortOrder =
      order === "desc" || order === "descending" || order === "-1" ? -1 : 1;

    const sortOptions = { [sortField]: sortOrder };
    if (sortField === "order") sortOptions.createdAt = 1;

    const carouselItems = await Slide.find(query)
      .sort(sortOptions)
      .select("-__v")
      .lean();

    res.status(200).json({
      success: true,
      count: carouselItems.length,
      data: carouselItems,
      filters: {
        sort: sortField,
        order: sortOrder === 1 ? "asc" : "desc",
        isActive: isActive ? isActive === "true" : undefined,
        search: search || undefined,
      },
    });
  } catch (error) {
    console.error("Error fetching hero carousel:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching carousel items.",
      error: process.env.NODE_ENV === "production" ? undefined : error.message,
    });
  }
};

const getActiveCarousel = async (req, res) => {
  try {
    const carouselItems = await Slide.aggregate([
      { $match: { isActive: true } },
      { $sort: { order: 1, createdAt: 1 } },
      {
        $project: {
          _id: 1,
          title: 1,
          highlight: 1,
          description: 1,
          buttonText: 1,
          order: 1,
          createdAt: 1,
          updatedAt: 1,
          image: {
            $cond: {
              if: { $gt: [{ $size: "$images" }, 0] },
              then: { $arrayElemAt: ["$images.url", 0] },
              else: "",
            },
          },
          buttonLinkFull: "$buttonLink",
        },
      },
    ]);

    const processedItems = carouselItems.map((item) => ({
      ...item,
      buttonLink: extractPathFromUrl(item.buttonLinkFull),
      buttonLinkFull: undefined,
    }));

    res.status(200).json({
      success: true,
      count: processedItems.length,
      data: processedItems,
    });
  } catch (error) {
    console.error("Error fetching active hero carousel:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching active carousel items.",
      error: process.env.NODE_ENV === "production" ? undefined : error.message,
    });
  }
};

const getCarouselItemBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const item = await Slide.findOne({ slug }).select("-__v").lean();

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Carousel item not found.",
      });
    }

    res.status(200).json({
      success: true,
      data: item,
    });
  } catch (error) {
    console.error("Error fetching carousel item:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching carousel item.",
      error: process.env.NODE_ENV === "production" ? undefined : error.message,
    });
  }
};

module.exports = {
  getCarousel,
  getActiveCarousel,
  getCarouselItemBySlug,
};
