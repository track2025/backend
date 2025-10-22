const PhysicalSubCategory = require("../models/PhysicalSubCategory");
const PhysicalProduct = require("../models/PhysicalProduct");
const PhysicalCategory = require("../models/PhysicalCategory");
const { singleFileDelete } = require('../config/uploader');

/* Create Subcategory by Admin */
const createSubCategoryByAdmin = async (req, res) => {
  try {
    const { cover, ...others } = req.body;

    const subCategory = await PhysicalSubCategory.create({
      ...others,
      cover: cover ? { ...cover } : null,
    });

    await PhysicalCategory.findByIdAndUpdate(others.parentCategory, {
      $addToSet: { subCategories: subCategory._id },
    });

    res.status(201).json({
      success: true,
      data: subCategory,
      message: "Subcategory Created",
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/* Get All Subcategories by Admin with pagination and search */
const getSubCategoriesByAdmin = async (req, res) => {
  try {
    const { limit = 10, page = 1, search = "", category, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let currentCategory = null;
    if (category) {
      currentCategory = await PhysicalCategory.findOne({ slug: category });
      if (!currentCategory) {
        return res
          .status(404)
          .json({ success: false, message: "Category not found!" });
      }
    }

    const query = { name: { $regex: search, $options: "i" } };
    if (currentCategory) query.parentCategory = currentCategory._id;
    if (status) query.status = status;

    const totalSubCategories = await PhysicalSubCategory.countDocuments(query);

    const subcategories = await PhysicalSubCategory.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .populate({ path: "parentCategory", select: ["name", "cover", "slug"] })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: subcategories,
      count: Math.ceil(totalSubCategories / parseInt(limit)),
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/* Get Subcategory by Slug (Admin) */
const getSubCategoryBySlugByAdmin = async (req, res) => {
  try {
    const { slug } = req.params;
    const subCategory = await PhysicalSubCategory.findOne({ slug });
    const categories = await PhysicalCategory.find().select(["name"]);

    if (!subCategory) {
      return res
        .status(404)
        .json({ success: false, message: "SubCategory Not Found" });
    }

    res.status(200).json({ success: true, data: subCategory, categories });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/* Update Subcategory by Slug (Admin) */
const updateSubCategoryBySlugByAdmin = async (req, res) => {
  try {
    const { slug } = req.params;
    const { cover, ...others } = req.body;

    const currentCategory = await PhysicalSubCategory.findOneAndUpdate(
      { slug },
      { ...others, cover: cover ? { ...cover } : null },
      { new: true, runValidators: true }
    );

    if (
      String(currentCategory.parentCategory) !== String(others.parentCategory)
    ) {
      await PhysicalCategory.findByIdAndUpdate(currentCategory.parentCategory, {
        $pull: { subCategories: currentCategory._id },
      });

      await PhysicalCategory.findByIdAndUpdate(others.parentCategory, {
        $addToSet: { subCategories: currentCategory._id },
      });
    }

    res.status(200).json({
      success: true,
      data: currentCategory,
      message: "Subcategory Updated",
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/* Delete Subcategory by Slug (Admin) */
const deleteSubCategoryBySlugByAdmin = async (req, res) => {
  try {
    const { slug } = req.params;

    const subCategory = await PhysicalSubCategory.findOne({ slug });
    if (!subCategory) {
      return res
        .status(404)
        .json({ success: false, message: "SubCategory Not Found" });
    }

    // Delete all products under this subcategory
    await PhysicalProduct.deleteMany({ subCategory: subCategory._id });

    // Delete subcategory cover if exists
    if (subCategory.cover) await singleFileDelete(req, subCategory.cover._id);

    // Remove reference from parent category
    await PhysicalCategory.findByIdAndUpdate(subCategory.parentCategory, {
      $pull: { subCategories: subCategory._id },
    });

    // Delete subcategory
    await PhysicalSubCategory.findByIdAndDelete(subCategory._id);

    res.status(204).json({
      success: true,
      message: "SubCategory Deleted Successfully",
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/* Get All Subcategories without pagination (Admin) */
const getAllSubCategoriesByAdmin = async (req, res) => {
  try {
    const subcategories = await PhysicalSubCategory.find()
      .populate({ path: "parentCategory", select: ["name", "cover", "slug"] })
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: subcategories });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  createSubCategoryByAdmin,
  updateSubCategoryBySlugByAdmin,
  deleteSubCategoryBySlugByAdmin,
  getSubCategoriesByAdmin,
  getSubCategoryBySlugByAdmin,
  getAllSubCategoriesByAdmin,
};
