const Category = require("../models/PhysicalCategory");
const SubCategory = require("../models/PhysicalSubCategory");
const PhysicalProduct = require("../models/PhysicalProduct");
const { singleFileDelete } = require("../config/uploader");

/* ──────────────── Create Category by Admin ──────────────── */
const createCategoryByAdmin = async (req, res) => {
  try {
    const { cover, ...others } = req.body;

    const newCategory = await Category.create({
      ...others,
      cover: cover ? { ...cover } : null,
    });

    res.status(201).json({
      success: true,
      message: "Category created successfully.",
      data: newCategory,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/* ──────────────── Get All Categories by Admin ──────────────── */
const getCategoriesByAdmin = async (req, res) => {
  try {
    const { limit = 10, page = 1, search = "", status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = { name: { $regex: search, $options: "i" } };
    if (status) query.status = status;

    const totalCategories = await Category.countDocuments(query);
    const categories = await Category.find(query)
      .populate({
        path: "subCategories",
        select: "name slug _id",
      })
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: categories,
      count: Math.ceil(totalCategories / parseInt(limit)),
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/* ──────────────── Get Category by Slug (Admin) ──────────────── */
const getCategoryBySlugByAdmin = async (req, res) => {
  try {
    const { slug } = req.params;

    const category = await Category.findOne({ slug }).select([
      "name",
      "description",
      "metaTitle",
      "metaDescription",
      "cover",
      "module",
      "slug",
      "subCategories",
    ]);

    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found." });
    }

    res.status(200).json({ success: true, data: category });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/* ──────────────── Update Category by Slug (Admin) ──────────────── */
const updateCategoryBySlugByAdmin = async (req, res) => {
  try {
    const { slug } = req.params;
    const { cover, ...others } = req.body;

    const updatedCategory = await Category.findOneAndUpdate(
      { slug },
      { ...others, cover: cover ? { ...cover } : null },
      { new: true, runValidators: true }
    );

    if (!updatedCategory) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found." });
    }

    res.status(200).json({
      success: true,
      message: "Category updated successfully.",
      data: updatedCategory,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/* ──────────────── Delete Category by Slug (Admin) ──────────────── */
const deleteCategoryBySlugByAdmin = async (req, res) => {
  try {
    const { slug } = req.params;

    const category = await Category.findOne({ slug });
    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found." });
    }

    // Delete products under subcategories
    await PhysicalProduct.deleteMany({ subCategory: { $in: category.subCategories } });

    // Delete subcategories
    await SubCategory.deleteMany({ _id: { $in: category.subCategories } });

    // Delete products directly under the category
    await PhysicalProduct.deleteMany({ category: category._id });

    // Delete category cover image (if any)
    if (category.cover) {
      await singleFileDelete(req, category.cover._id);
    }

    // Delete category itself
    await Category.deleteOne({ _id: category._id });

    res.status(204).json({
      success: true,
      message: "Category deleted successfully.",
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
};
