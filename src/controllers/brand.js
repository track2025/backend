const Brands = require("../models/Brand");
const getBlurDataURL = require("../config/getBlurDataURL");
const { singleFileDelete } = require("../config/uploader");

const createBrand = async (req, res) => {
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
    const dataaa = await singleFileDelete(brand?.logo?._id);

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

module.exports = {
  createBrand,
  getAllBrands,
  getBrandBySlug,
  updateBrandBySlug,
  deleteBrandBySlug,
  getBrands,
};
