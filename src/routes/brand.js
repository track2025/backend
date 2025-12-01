const express = require("express");
const router = express.Router();
const brand = require("../controllers/brand");

// Import verifyToken function
const verifyToken = require("../config/jwt");

// admin routes

router.post("/admin/brands", verifyToken, brand.createBrand);

router.get("/admin/brands", verifyToken, brand.getAllTracksByadmin);

router.get("/admin/brands/:slug", verifyToken, brand.getBrandBySlug);

router.put("/admin/brands/:slug", verifyToken, brand.updateBrandBySlug);

router.delete("/admin/brands/:slug", verifyToken, brand.deleteBrandBySlug);

router.get("/admin/all-brands", brand.getAllBrands);

// User routes

router.get("/brands", brand.getAllBrands);

//user track pages apis
router.get("/tracks", brand.getAllTracks);
router.get("/tracks/:slug", brand.getTrackBySlug);
router.get("/tracks/events/:trackSlug", brand.getEventsByTrackSlug);
module.exports = router;
