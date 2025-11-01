const PhysicalSubCategory = require("../models/PhysicalSubCategory");
const PhysicalProduct = require("../models/PhysicalProduct");
const PhysicalCategory = require("../models/PhysicalCategory");
const { singleFileDelete } = require('../config/uploader');

const createSubCategoryByAdmin = async (req, res) => {
  try {
    const { cover, ...others } = req.body;

    const category = await PhysicalSubCategory.create({
      ...others,
      cover: {
        ...cover,
      },
    });
    await PhysicalCategory.findByIdAndUpdate(others.parentCategory, {
      $addToSet: {
        subCategories: category._id,
      },
    });

    res.status(201).json({ success: true, message: "Physical Subcategory Created" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
/*     Get All Subcategories by Admin    */
const getSubCategoriesByAdmin = async (req, res) => {
  try {
    const { limit = 10, page = 1, search = "", category, status } = req.query;
    const currentCategory = category
      ? await PhysicalCategory.findOne({ slug: category })
      : null;
    if (category && !currentCategory) {
      res.status(404).json({ success: false, message: "Physical Category not found!" });
    }
    const skip = parseInt(limit) || 10;
    const query = {
      name: { $regex: search, $options: "i" },
      ...(currentCategory && { parentCategory: currentCategory._id }),
    };

    if (status) {
      query.status = status;
    }

    const totalSubCategories = await PhysicalSubCategory.find(query);

    const subcategories = await PhysicalSubCategory.find(query, null, {
      skip: skip * (parseInt(page) - 1 || 0),
      limit: skip,
    })
      .populate({ path: "parentCategory", select: ["name", "cover", "slug"] })
      .sort({
        createdAt: -1,
      });
    res.status(200).json({
      success: true,
      data: subcategories,
      count: Math.ceil(totalSubCategories.length / skip),
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
/*    Get Subcategory by Slug (Admin)    */
const getSubCategoryBySlugByAdmin = async (req, res) => {
  try {
    const { slug } = req.params;
    const subcategories = await PhysicalSubCategory.findOne({ slug });
    const categories = await PhysicalCategory.find().select(["name"]);

    if (!subcategories) {
      return res.status(400).json({
        success: false,
        message: "Physical SubCategory Not Found",
      });
    }

    res.status(200).json({ success: true, data: subcategories, categories });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
/*     Update Subcategory by Slug (Admin)    */
const updateSubCategoryBySlugByAdmin = async (req, res) => {
  try {
    const { slug } = req.params;
    const { cover, ...others } = req.body;
    const currentCategory = await PhysicalSubCategory.findOneAndUpdate(
      { slug },
      {
        ...others,
        cover: {
          ...cover,
        },
      },
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
      message: "Physical Subcategory Updated",
      currentCategory,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
/*     Delete Subcategory by Slug (Admin)    */
const deleteSubCategoryBySlugByAdmin = async (req, res) => {
  try {
    const { slug } = req.params;

    console.info(slug);

    const subCategory = await PhysicalSubCategory.findOne({ slug });

    if (!subCategory) {
      return res.status(404).json({
        success: false,
        message: "Physical SubCategory Not Found",
      });
    }

    await PhysicalProduct.deleteMany({ subCategory: subCategory._id });

    if (subCategory?.cover?._id) {
      await singleFileDelete(req, subCategory.cover._id);
    }

    await PhysicalCategory.findByIdAndUpdate(subCategory.parentCategory, {
      $pull: { subCategories: subCategory._id },
    });

    await PhysicalSubCategory.findByIdAndDelete(subCategory._id);

    res.status(200).json({
      success: true,
      message: "Physical SubCategory Deleted Successfully",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/*     Get All Subcategories by Admin    */
const getAllSubCategoriesByAdmin = async (req, res) => {
  try {
    const subcategories = await PhysicalSubCategory.find()
      .populate({ path: "parentCategory", select: ["name", "cover", "slug"] })
      .sort({
        createdAt: -1,
      });

    res.status(200).json({
      success: true,
      data: subcategories,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getPhysicalSubCategoriesByCategory = async (req, res) => {
  try {
    const { categorySlug } = req.params;

    // Find the parent category
    const category = await PhysicalCategory.findOne({ slug: categorySlug });
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // Find subcategories for this category
    const subcategories = await PhysicalSubCategory.find({ parentCategory: category._id })
      .populate({ path: "parentCategory", select: ["name", "slug"] })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: subcategories,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createSubCategoryByAdmin,
  updateSubCategoryBySlugByAdmin,
  deleteSubCategoryBySlugByAdmin,
  getSubCategoriesByAdmin,
  getSubCategoryBySlugByAdmin,
  getAllSubCategoriesByAdmin,
  getPhysicalSubCategoriesByCategory,
};
