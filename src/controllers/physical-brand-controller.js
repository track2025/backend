const PhysicalBrand = require("../models/PhysicalBrand");
const PhysicalProduct = require("../models/PhysicalProduct");
const { singleFileDelete } = require('../config/uploader');

/*  Create a new brand by admin */
const createBrandByAdmin = async (req, res) => {
  try {
    const { logo, ...others } = req.body;

    const newBrand = await PhysicalBrand.create({
      ...others,
      logo: logo ? { ...logo } : null,
      totalItems: 0,
    });

    res.status(201).json({
      success: true,
      data: newBrand,
      message: "Brand Created",
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/*  Get all brands (admin) with pagination and search */
const getBrandsByAdmin = async (req, res) => {
  try {
    const { limit = 10, page = 1, search = "", status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = { name: { $regex: search, $options: "i" } };
    if (status) query.status = status;

    const totalBrands = await PhysicalBrand.countDocuments(query);
    const brands = await PhysicalBrand.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: brands,
      count: Math.ceil(totalBrands / parseInt(limit)),
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/*  Get a single brand by slug (admin) */
const getBrandBySlugByAdmin = async (req, res) => {
  try {
    const { slug } = req.params;
    const brand = await PhysicalBrand.findOne({ slug });

    if (!brand) {
      return res.status(404).json({ success: false, message: "Brand Not Found" });
    }

    res.status(200).json({ success: true, data: brand });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/*  Update brand details by slug (admin) */
const updateBrandBySlugByAdmin = async (req, res) => {
  try {
    const { slug } = req.params;
    const { logo, ...others } = req.body;

    const updatedBrand = await PhysicalBrand.findOneAndUpdate(
      { slug },
      { ...others, logo: logo ? { ...logo } : null },
      { new: true, runValidators: true }
    );

    if (!updatedBrand) {
      return res.status(404).json({ success: false, message: "Brand Not Found" });
    }

    res.status(200).json({
      success: true,
      data: updatedBrand,
      message: "Brand Updated",
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/*  Delete brand by slug (admin) */
const deleteBrandBySlugByAdmin = async (req, res) => {
  try {
    const { slug } = req.params;
    const brand = await PhysicalBrand.findOne({ slug });

    if (!brand) {
      return res.status(404).json({ success: false, message: "Brand Not Found" });
    }

    // Delete all products linked to this brand
    await PhysicalProduct.deleteMany({ brand: brand._id });

    // Delete logo file
    if (brand.logo) {
      await singleFileDelete(req, brand.logo._id);
    }

    // Delete the brand itself
    await PhysicalBrand.deleteOne({ _id: brand._id });

    res.status(200).json({
      success: true,
      message: "Brand and linked products deleted successfully",
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};


module.exports = {
  createBrandByAdmin,
  getBrandsByAdmin,
  getBrandBySlugByAdmin,
  updateBrandBySlugByAdmin,
  deleteBrandBySlugByAdmin,
};
