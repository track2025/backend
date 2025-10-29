const express = require("express");
const router = express.Router();
const physicalSubCategory = require("../controllers/physical-sub-category-controller");

const verifyToken = require('../config/jwt');

/*
================================
Physial Sub Categories (Admin)
================================
*/ 
router.post("/admin/physical-sub-categories", verifyToken, physicalSubCategory.createSubCategoryByAdmin);

router.get("/admin/physical-sub-categories", verifyToken, physicalSubCategory.getSubCategoriesByAdmin);

router.get("/admin/physical-sub-categories/:slug", verifyToken, physicalSubCategory.getSubCategoryBySlugByAdmin);

router.put("/admin/physical-sub-categories/:slug", verifyToken, physicalSubCategory.updateSubCategoryBySlugByAdmin);

router.delete("/admin/physical-sub-categories/:slug", verifyToken, physicalSubCategory.deleteSubCategoryBySlugByAdmin);

router.get("/admin/physical-sub-categories/all", physicalSubCategory.getAllSubCategoriesByAdmin);

module.exports = router;
