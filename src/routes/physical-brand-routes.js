const express = require("express");
const router = express.Router();
const physicalBrandController = require("../controllers/physical-brand-controller");
const verifyToken = require("../config/jwt");

// Admin routes
router.post("/admin/physical/brands", verifyToken, physicalBrandController.createBrandByAdmin);
router.get("/admin/physical/brands", verifyToken, physicalBrandController.getBrandsByAdmin);
router.get("/admin/physical/brands/:slug", verifyToken, physicalBrandController.getBrandBySlugByAdmin);
router.put("/admin/physical/brands/:slug", verifyToken, physicalBrandController.updateBrandBySlugByAdmin);
router.delete("/admin/physical/brands/:slug", verifyToken, physicalBrandController.deleteBrandBySlugByAdmin);
router.get("/admin/physical/all-brands", physicalBrandController.getAllBrandsByAdmin);

// User routes
router.get("/physical/brands", physicalBrandController.getAllBrandsByAdmin);

module.exports = router;
