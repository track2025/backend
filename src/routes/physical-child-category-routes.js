const express = require("express");
const router = express.Router();
const physicalChildCategory = require("../controllers/physical-child-category-controller");

const verifyToken = require('../config/jwt');

// Create Physical Child Category (Admin)
router.post(
    "/admin/physical-child-categories",
    verifyToken,
    physicalChildCategory.createChildCategoryByAdmin
);

// Get all Physical Child Categories (Admin)
router.get(
    "/admin/physical-child-categories",
    verifyToken,
    physicalChildCategory.getAllChildCategoriesByAdmin
);

// Get a specific Physical Child Category by slug (Admin)
router.get(
    "/admin/physical-child-categories/:slug",
    verifyToken,
    physicalChildCategory.getChildCategoryBySlugByAdmin
);

// Update a Physical Child Category by slug (Admin)
router.put(
    "/admin/physical-child-categories/:slug",
    verifyToken,
    physicalChildCategory.updateChildCategoryBySlugByAdmin
);

// Delete a Physical Child Category by slug (Admin)
router.delete(
    "/admin/physical-child-categories/:slug",
    verifyToken,
    physicalChildCategory.deleteChildCategoryBySlugByAdmin
);

// Public or simplified route (optional)
router.get(
    "/admin/physical-child-categories/all",
    verifyToken,
    physicalChildCategory.getChildCategoriesByAdmin
);

module.exports = router;
