const express = require("express");
const router = express.Router();
const physicalSubCategory = require("../controllers/physical-sub-category-controller");

const verifyToken = require('../config/jwt');

// Create Physical Sub Category (Admin)
router.post(
  "/admin/physical-sub-categories",
  verifyToken,
  physicalSubCategory.createSubCategoryByAdmin
);

// Get all Physical Sub Categories (Admin)
router.get(
  "/admin/physical-sub-categories",
  verifyToken,
  physicalSubCategory.getSubCategoriesByAdmin
);

// Get a specific Physical Sub Category by slug (Admin)
router.get(
  "/admin/physical-sub-categories/:slug",
  verifyToken,
  physicalSubCategory.getSubCategoryBySlugByAdmin
);

// Update a Physical Sub Category by slug (Admin)
router.put(
  "/admin/physical-sub-categories/:slug",
  verifyToken,
  physicalSubCategory.updateSubCategoryBySlugByAdmin
);

// Delete a Physical Sub Category by slug (Admin)
router.delete(
  "/admin/physical-sub-categories/:slug",
  verifyToken,
  physicalSubCategory.deleteSubCategoryBySlugByAdmin
);

// Public route to get all Physical Sub Categories (optional)
router.get(
  "/admin/physical-sub-categories/all",
  physicalSubCategory.getAllSubCategoriesByAdmin
);

module.exports = router;
