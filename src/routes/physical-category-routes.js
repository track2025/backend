const express = require("express");
const router = express.Router();
const PhysicalCategory = require("../controllers/physical-category-controller");

const verifyToken = require('../config/jwt');

/*
===================================
Physical Categories (Admin)
===================================
*/
router.post("/admin/physical-categories", verifyToken, PhysicalCategory.createCategoryByAdmin);

router.get("/admin/physical-categories", verifyToken, PhysicalCategory.getCategoriesByAdmin);

router.get("/admin/physical-categories/:slug", verifyToken, PhysicalCategory.getCategoryBySlugByAdmin);

router.put("/admin/physical-categories/:slug", verifyToken, PhysicalCategory.updateCategoryBySlugByAdmin);

router.delete("/admin/physical-categories/:slug", verifyToken, PhysicalCategory.deleteCategoryBySlugByAdmin);

router.get("/admin/all-physical-categories", PhysicalCategory.getCategoriesByAdmin);

// Public route, no verification
router.get("/physical-categories", PhysicalCategory.getAllPhysicalCategoriesPublic);


module.exports = router;
