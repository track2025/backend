const express = require("express");
const router = express.Router();
const PhysicalBrand = require("../controllers/physical-brand-controller");
const verifyToken = require("../config/jwt");

// Admin routes
router.post(
    "/admin/physical-brands",
    verifyToken,
    PhysicalBrand.createBrandByAdmin
);

router.get(
    "/admin/physical-brands",
    verifyToken,
    PhysicalBrand.getBrandsByAdmin
);

router.get(
    "/admin/physical-brands/:slug",
    verifyToken,
    PhysicalBrand.getBrandBySlugByAdmin
);

router.put(
    "/admin/physical-brands/:slug",
    verifyToken,
    PhysicalBrand.updateBrandBySlugByAdmin
);

router.delete(
    "/admin/physical-brands/:slug",
    verifyToken,
    PhysicalBrand.deleteBrandBySlugByAdmin
);

// Public route (optional)
router.get("/admin/all-physical-brands", PhysicalBrand.getBrandsByAdmin);

module.exports = router;
