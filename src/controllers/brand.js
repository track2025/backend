const Brands = require("../models/Brand");
const getBlurDataURL = require("../config/getBlurDataURL");
const { singleFileDelete } = require("../config/uploader");
const Event = require("../models/Event");
const Product = require("../models/Product");

const createBrand = async (req, res) => {
  console.log(req.body);

  try {
    const { logo, bannerImage, thumbnailImage, ...others } = req.body;

    // ✅ Validate image fields
    if (!logo?.url || !bannerImage?.url || !thumbnailImage?.url) {
      return res.status(400).json({ message: "Invalid Image Data Provided" });
    }

    // ✅ Generate blurDataURL for each image
    const [logoBlur, bannerBlur, thumbnailBlur] = await Promise.all([
      getBlurDataURL(logo.url),
      getBlurDataURL(bannerImage.url),
      getBlurDataURL(thumbnailImage.url),
    ]);

    // ✅ Create new Brand document
    const newBrand = await Brands.create({
      ...others,
      logo: { ...logo, blurDataURL: logoBlur },
      bannerImage: { ...bannerImage, blurDataURL: bannerBlur },
      thumbnailImage: { ...thumbnailImage, blurDataURL: thumbnailBlur },
      totalItems: 0,
    });

    res.status(201).json({
      success: true,
      data: newBrand,
      message: "Location Created Successfully",
    });
  } catch (error) {
    console.error("Create Brand Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server Error",
    });
  }
};
const getAllBrands = async (req, res) => {
  try {
    const brands = await Brands.find().sort({
      createdAt: -1,
    });
    res.status(201).json({
      success: true,
      data: brands,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getBrandBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const brand = await Brands.findOne({ slug });

    if (!brand) {
      return res.status(404).json({ message: "Brand Not Found" });
    }

    res.status(201).json({
      success: true,
      data: brand,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const updateBrandBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const {
      slug: sipSlug,
      logo,
      bannerImage,
      thumbnailImage,
      ...others
    } = req.body;


    // ✅ Prepare image processing helper
    const processImage = async (image) => {
      if (!image) return null;
      if (!image.url) throw new Error("Invalid image data: missing URL");
      if (!image.blurDataURL) {
        image.blurDataURL = await getBlurDataURL(image.url);
      }
      return image;
    };

    // ✅ Process all images (logo, banner, thumbnail)
    const processedLogo = await processImage(logo);
    const processedBanner = await processImage(bannerImage);
    const processedThumbnail = await processImage(thumbnailImage);

    // ✅ Update Brand
    const updatedBrand = await Brands.findOneAndUpdate(
      { slug },
      {
        ...others,
        logo: processedLogo,
        bannerImage: processedBanner,
        thumbnailImage: processedThumbnail,
      },
      { new: true, runValidators: true }
    );

    if (!updatedBrand) {
      return res.status(404).json({ message: "Brand Not Found" });
    }

    res.status(200).json({
      success: true,
      data: updatedBrand,
      message: "Location Updated Successfully",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || "Something went wrong while updating brand",
    });
  }
};

const deleteBrandBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const brand = await Brands.findOne({ slug });

    if (!brand) {
      return res.status(404).json({ message: "Brand Not Found" });
    }
    // Uncomment the line below if you have a function to delete the logo file
    // const dataaa = await singleFileDelete(brand?.logo?._id);

    await Brands.deleteOne({ slug });

    res.status(201).json({ success: true, message: "Brand Deleted" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getBrands = async (req, res) => {
  try {
    const brands = await Brands.find().sort({
      createdAt: -1,
    });

    res.status(201).json({
      success: true,
      data: brands,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAllTracksByadmin = async (req, res) => {
  try {
    const {
      limit = 10,
      page = 1,
      search = "",
      country,
    } = req.query;

    const limitNumber = parseInt(limit);
    const pageNumber = parseInt(page) || 1;
    const skip = limitNumber * (pageNumber - 1);

    // Build filter
    let filter = { status };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { city: { $regex: search, $options: "i" } },
        { country: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }
    if (country) filter.country = country;

    // Count total matching tracks
    const totalTracks = await Brands.countDocuments(filter);

    // Fetch paginated tracks
    const tracks = await Brands.find(filter)
      .sort({ name: 1 })
      .skip(skip)
      .limit(limitNumber);

    res.status(200).json({
      success: true,
      data: tracks,
      total: totalTracks,
      count: Math.ceil(totalTracks / limitNumber),
      currentPage: pageNumber,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAllTracks = async (req, res) => {
  try {
    const {
      limit = 100,
      page = 1,
      search = "",
      country,
      status = "active",
    } = req.query;

    const limitNumber = parseInt(limit);
    const pageNumber = parseInt(page) || 1;
    const skip = limitNumber * (pageNumber - 1);

    // Build filter
    let filter = { status };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { city: { $regex: search, $options: "i" } },
        { country: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }
    if (country) filter.country = country;

    // Get product counts in a separate optimized query
    const productCounts = await Product.aggregate([
      { $match: { status: { $ne: "disabled" } } },
      { $group: { _id: "$location", totalProducts: { $sum: 1 } } },
    ]);

    // Convert to a map for fast lookup
    const productCountMap = new Map(
      productCounts.map((pc) => [pc._id, pc.totalProducts])
    );

    // Count total matching tracks
    const totalTracks = await Brands.countDocuments(filter);

    // Fetch paginated tracks
    const tracks = await Brands.find(filter)
      .sort({ name: 1 })
      .skip(skip)
      .limit(limitNumber)
      .lean();

    // Add product counts in JavaScript
    const tracksWithCounts = tracks.map((track) => ({
      ...track,
      totalProducts: productCountMap.get(track.name) || 0,
    }));

    res.status(200).json({
      success: true,
      data: tracksWithCounts,
      total: totalTracks,
      count: Math.ceil(totalTracks / limitNumber),
      currentPage: pageNumber,
    });
  } catch (error) {
    console.log("err:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getTrackBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    if (!slug) {
      return res
        .status(400)
        .json({ success: false, message: "Slug is required" });
    }

    const track = await Brands.findOne({ slug, status: "active" });

    if (!track) {
      return res
        .status(404)
        .json({ success: false, message: "Track not found" });
    }

    res.status(200).json({
      success: true,
      data: track,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getFeaturedTracks = async (req, res) => {
  try {
    const { limit = 6 } = req.query;
    const limitNumber = parseInt(limit);

    const tracks = await Brands.find({
      status: "active",
      featured: true,
    })
      .sort({ name: 1 })
      .limit(limitNumber);

    res.status(200).json({
      success: true,
      data: tracks,
      total: tracks.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getEventsByTrackSlug = async (req, res) => {
  try {
    const { trackSlug } = req.params;

    // Build the filter
    const filter = {
      trackSlug: trackSlug,
      status: { $ne: "disabled" }, // Exclude disabled events
    };

    // Fetch events
    const events = await Event.find(filter)
      .sort({ date: 1, startTime: 1 }) // Sort by date and time ascending (upcoming first)
      .select("-__v")
      .lean();

    // console.log("ev::", events);

    res.status(200).json({
      success: true,
      data: events,
      total: events.length,
    });
  } catch (error) {
    console.error("Error fetching events by track slug:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

module.exports = {
  createBrand,
  getAllBrands,
  getBrandBySlug,
  updateBrandBySlug,
  deleteBrandBySlug,
  getBrands,

  //user tracks page apis
  getAllTracks,
  getAllTracksByadmin,
  getTrackBySlug,
  getFeaturedTracks,
  getEventsByTrackSlug,
};
