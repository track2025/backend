const express = require("express");
const router = express.Router();
const PhysicalBrand = require("../controllers/physical-brand-controller");
const verifyToken = require("../config/jwt");

/*
===============================
Physical Brands Routes (admin)
===============================
*/
router.post("/admin/physical-brands", verifyToken, PhysicalBrand.createBrandByAdmin);

router.get("/admin/physical-brands", verifyToken, PhysicalBrand.getBrandsByAdmin);

router.get("/admin/physical-brands/:slug", verifyToken, PhysicalBrand.getBrandBySlugByAdmin);

router.put("/admin/physical-brands/:slug", verifyToken, PhysicalBrand.updateBrandBySlugByAdmin);

router.delete("/admin/physical-brands/:slug", verifyToken, PhysicalBrand.deleteBrandBySlugByAdmin);

router.get("/admin/all-physical-brands", PhysicalBrand.getAllBrandsByAdmin);

module.exports = router;
