const PhysicalCategory = require("../models/PhysicalCategory");
const PhysicalSubCategory = require("../models/PhysicalSubCategory");
const PhysicalProduct = require("../models/PhysicalProduct");
const { singleFileDelete } = require("../config/uploader");

//  Create Category by Admin
const createCategoryByAdmin = async (req, res) => {
  try {
    const { cover, ...others } = req.body;
    await PhysicalCategory.create({
      ...others,
      cover: {
        ...cover,
      },
    });

    res.status(201).json({ success: true, message: "Category Created" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
//  Get All Categories by Admin
const getCategoriesByAdmin = async (req, res) => {
  try {
    const { limit = 10, page = 1, search = "", status } = req.query;

    const skip = parseInt(limit) || 10;
    const query = {
      name: { $regex: search, $options: "i" },
    };

    if (status) {
      query.status = status;
    }
    const totalCategories = await PhysicalCategory.find(query);
    const categories = await PhysicalCategory.find(query, null, {
      skip: skip * (parseInt(page) - 1 || 0),
      limit: skip,
    })
      .populate({
        path: "subCategories",
        select: "name slug",
      })
      .sort({
        createdAt: -1,
      });

    res.status(200).json({
      success: true,
      data: categories,
      count: Math.ceil(totalCategories.length / skip),
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

//  Get Category by Slug (Admin)
const getCategoryBySlugByAdmin = async (req, res) => {
  try {
    const { slug } = req.params;
    const category = await PhysicalCategory.findOne({ slug }).select([
      "name",
      "description",
      "metaTitle",
      "metaDescription",
      "cover",
      "module",
      "slug",
    ]);

    if (!category) {
      return res.status(400).json({
        success: false,
        message: "Category Not Found",
      });
    }

    res.status(200).json({ success: true, data: category });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

//  Update Category by Slug (Admin)
const updateCategoryBySlugByAdmin = async (req, res) => {
  try {
    const { slug } = req.params;
    const { cover, ...others } = req.body;
    await PhysicalCategory.findOneAndUpdate(
      { slug },
      {
        ...others,
        cover: {
          ...cover,
        },
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({ success: true, message: "Category Updated" });
  } catch (error) {
    console.log("error::::>>>", error);
    if (
      error.errorResponse &&
      error.errorResponse.codeName === "DuplicateKey"
    ) {
      return res.status(400).json({
        success: false,
        message: "Slug already exists. Please choose a different slug.",
      });
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

//  Delete Category by Slug (Admin)
const deleteCategoryBySlugByAdmin = async (req, res) => {
  try {
    const { slug } = req.params;
    const category = await PhysicalCategory.findOneAndDelete({ slug });

    await PhysicalProduct.deleteMany({
      subCategory: { $in: category.subCategories },
    });

    await PhysicalSubCategory.deleteMany({
      _id: { $in: category.subCategories },
    });

    await PhysicalProduct.deleteMany({ category: category._id });
    if (category && category.cover) {
      await singleFileDelete(req, category.cover._id);
    }

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Physical Category Not Found",
      });
    }

    res
      .status(204)
      .json({
        success: true,
        message: "Physical Category Deleted Successfully",
      });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getAllPhysicalCategoriesPublic = async (req, res) => {
  try {
    // Only return active categories
    console.log("Hello world");
    

    const categories = await PhysicalCategory.find({ status: "active" })
      .populate({
        path: "subCategories",
        match: { status: "active" }, // <- filter only active subcategories
        select: "name status",
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: categories,
      count: categories.length,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  createCategoryByAdmin,
  getCategoriesByAdmin,
  getCategoryBySlugByAdmin,
  updateCategoryBySlugByAdmin,
  deleteCategoryBySlugByAdmin,
  getAllPhysicalCategoriesPublic,
};
