const PhysicalBrand = require("../models/PhysicalBrand");
const PhysicalProduct = require("../models/PhysicalProduct");
const PhysicalCategory = require("../models/PhysicalCategory");
const { singleFileDelete } = require("../config/uploader");

/*----------------------------------
  Create a new physical product (Admin)
-----------------------------------*/
const createPhysicalProductByAdmin = async (req, res) => {
  try {
    const { images, ...others } = req.body;

    const newProduct = await PhysicalProduct.create({
      ...others,
      images: images?.length ? images.map((img) => ({ ...img })) : [],
    });

    res.status(201).json({
      success: true,
      message: "Physical product created successfully.",
      data: newProduct,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/*----------------------------------
  Get all physical products (Admin)
  with pagination, search, filters
-----------------------------------*/
const getPhysicalProductsByAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", category, brand, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = {
      name: { $regex: search, $options: "i" },
    };

    if (status) query.status = status;

    // Filter by category
    if (category) {
      const foundCategory = await PhysicalCategory.findOne({ slug: category }).select("_id");
      if (foundCategory) query.category = foundCategory._id;
    }

    // Filter by brand
    if (brand) {
      const foundBrand = await PhysicalBrand.findOne({ slug: brand }).select("_id");
      if (foundBrand) query.brand = foundBrand._id;
    }

    const totalProducts = await PhysicalProduct.countDocuments(query);

    const products = await PhysicalProduct.find(query)
      .populate("brand", "name slug")
      .populate("category", "name slug")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: products,
      count: Math.ceil(totalProducts / parseInt(limit)),
      total: totalProducts,
      message: "Products fetched successfully.",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/*----------------------------------
  Get a single physical product by slug (Admin)
-----------------------------------*/
const getOnePhysicalProductByAdmin = async (req, res) => {
  try {
    const { slug } = req.params;

    const product = await PhysicalProduct.findOne({ slug })
      .populate("brand", "name slug")
      .populate("category", "name slug");

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Physical product not found.",
      });
    }

    res.status(200).json({
      success: true,
      data: product,
      message: "Physical product fetched successfully.",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/*----------------------------------
  Update a physical product by slug (Admin)
-----------------------------------*/
const updatePhysicalProductByAdmin = async (req, res) => {
  try {
    const { slug } = req.params;
    const { images, ...others } = req.body;

    const updatedProduct = await PhysicalProduct.findOneAndUpdate(
      { slug },
      {
        ...others,
        images: images?.length ? images.map((img) => ({ ...img })) : [],
      },
      { new: true, runValidators: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({
        success: false,
        message: "Physical product not found.",
      });
    }

    res.status(200).json({
      success: true,
      data: updatedProduct,
      message: "Physical product updated successfully.",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/*----------------------------------
  Delete a physical product by slug (Admin)
-----------------------------------*/
const deletePhysicalProductByAdmin = async (req, res) => {
  try {
    const { slug } = req.params;
    const product = await PhysicalProduct.findOne({ slug });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Physical product not found.",
      });
    }

    // Delete all uploaded image files
    if (product.images && product.images.length > 0) {
      for (const img of product.images) {
        if (img?._id) {
          await singleFileDelete(req, img._id);
        }
      }
    }

    await PhysicalProduct.deleteOne({ _id: product._id });

    res.status(200).json({
      success: true,
      message: "Physical product and associated files deleted successfully.",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createPhysicalProductByAdmin,
  getPhysicalProductsByAdmin,
  getOnePhysicalProductByAdmin,
  updatePhysicalProductByAdmin,
  deletePhysicalProductByAdmin,
};
