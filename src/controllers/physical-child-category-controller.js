const PhysicalChildCategory = require("../models/PhysicalChildCategory");
const PhysicalSubCategory = require("../models/PhysicalSubCategory");
const PhysicalCategory = require("../models/PhysicalCategory");
const PhysicalProduct = require("../models/PhysicalProduct");
const { singleFileDelete } = require('../config/uploader');

//  Create Child Category by Admin
const createChildCategoryByAdmin = async (req, res) => {
  try {
    const { cover, ...others } = req.body;

    const childCategory = await PhysicalChildCategory.create({
      ...others,
      cover: cover ? { ...cover } : null,
    });

    await PhysicalSubCategory.findByIdAndUpdate(others.subCategory, {
      $addToSet: { childCategories: childCategory._id },
    });

    res.status(201).json({
      success: true,
      data: childCategory,
      message: "Child Category Created",
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

//  Get All Child Categories by Admin with pagination and search
const getAllChildCategoriesByAdmin = async (req, res) => {
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
    if (currentCategory) query.subCategory = currentCategory._id;
    if (status) query.status = status;

    const totalChildCategories = await PhysicalChildCategory.countDocuments(query);

    const childCategories = await PhysicalChildCategory.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .populate({
        path: "subCategory",
        select: ["_id", "name", "cover", "slug", "parentCategory"],
        populate: {
          path: "parentCategory",
          select: ["_id", "name", "cover", "slug"],
        },
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: childCategories,
      count: Math.ceil(totalChildCategories / parseInt(limit)),
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

//  Get Child Category by Slug (Admin)
const getChildCategoryBySlugByAdmin = async (req, res) => {
  try {
    const { slug } = req.params;
    const childCategory = await PhysicalChildCategory.findOne({ slug }).populate({
      path: "subCategory",
      select: ["name", "parentCategory"],
      populate: { path: "parentCategory", select: ["name"] },
    });

    if (!childCategory) {
      return res
        .status(404)
        .json({ success: false, message: "ChildCategory Not Found" });
    }

    const categories = await PhysicalCategory.find()
      .populate({ path: "subCategories", select: ["name"] })
      .select(["name"]);

    res.status(200).json({ success: true, data: childCategory, categories });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

//  Update Child Category by Slug (Admin)
const updateChildCategoryBySlugByAdmin = async (req, res) => {
  try {
    const { slug } = req.params;
    const { cover, ...others } = req.body;

    const currentCategory = await PhysicalChildCategory.findOne({ slug });
    if (!currentCategory) {
      return res
        .status(404)
        .json({ success: false, message: "Child Category not found" });
    }

    const updatedCategory = await PhysicalChildCategory.findOneAndUpdate(
      { slug },
      { ...others, cover: cover ? { ...cover } : null },
      { new: true, runValidators: true }
    );

    // Update parent subcategory if changed
    if (String(currentCategory.subCategory) !== String(others.subCategory)) {
      await PhysicalSubCategory.findByIdAndUpdate(currentCategory.subCategory, {
        $pull: { childCategories: currentCategory._id },
      });
      await PhysicalSubCategory.findByIdAndUpdate(others.subCategory, {
        $addToSet: { childCategories: updatedCategory._id },
      });
    }

    res.status(200).json({
      success: true,
      data: updatedCategory,
      message: "Child Category Updated",
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

//  Delete Child Category by Slug (Admin)
const deleteChildCategoryBySlugByAdmin = async (req, res) => {
  try {
    const { slug } = req.params;
    const childCategory = await PhysicalChildCategory.findOneAndDelete({ slug });

    if (!childCategory) {
      return res
        .status(404)
        .json({ success: false, message: "ChildCategory Not Found" });
    }

    await PhysicalProduct.deleteMany({ childCategory: childCategory._id });
    if (childCategory.cover) await singleFileDelete(req, childCategory.cover._id);
    await PhysicalSubCategory.findByIdAndUpdate(childCategory.subCategory, {
      $pull: { childCategories: childCategory._id },
    });

    res
      .status(204)
      .json({ success: true, message: "ChildCategory Deleted Successfully" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

//  Get All Child Categories (Admin) without pagination
const getChildCategoriesByAdmin = async (req, res) => {
  try {
    const categories = await PhysicalChildCategory.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: categories });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  createChildCategoryByAdmin,
  getAllChildCategoriesByAdmin,
  getChildCategoryBySlugByAdmin,
  updateChildCategoryBySlugByAdmin,
  deleteChildCategoryBySlugByAdmin,
  getChildCategoriesByAdmin,
};
