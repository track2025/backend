const express = require("express");
const router = express.Router();
const PhysicalCategory = require("../controllers/physical-category-controller");

const verifyToken = require('../config/jwt');

// Create a new physical category (Admin)
router.post(
    "/admin/physical-categories",
    verifyToken,
    PhysicalCategory.createCategoryByAdmin
);

// Get all physical categories (Admin)
router.get(
    "/admin/physical-categories",
    verifyToken,
    PhysicalCategory.getCategoriesByAdmin
);

// Get a specific physical category by slug (Admin)
router.get(
    "/admin/physical-categories/:slug",
    verifyToken,
    PhysicalCategory.getCategoryBySlugByAdmin
);

// Update a physical category by slug (Admin)
router.put(
    "/admin/physical-categories/:slug",
    verifyToken,
    PhysicalCategory.updateCategoryBySlugByAdmin
);

// Delete a physical category by slug (Admin)
router.delete(
    "/admin/physical-categories/:slug",
    verifyToken,
    PhysicalCategory.deleteCategoryBySlugByAdmin
);

// Public route to get all physical categories (optional)
router.get("/admin/all-physical-categories", PhysicalCategory.getCategoriesByAdmin);

module.exports = router;
