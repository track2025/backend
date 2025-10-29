const express = require("express");
const router = express.Router();
const PhysicalProduct = require("../controllers/physical-product-controller");
const UserPhysicalProduct = require("../controllers/user/physical-product-controller");
const verifyToken = require("../config/jwt");

/*
==========================================
Physical Product (Admin)
==========================================
*/ 
router.post("/admin/physical-products", verifyToken, PhysicalProduct.createProductByAdmin);

router.get("/admin/physical-products", verifyToken, PhysicalProduct.getProductsByAdmin);

router.get("/admin/physical-products/:slug", verifyToken, PhysicalProduct.getOneProductByAdmin);

router.put("/admin/physical-products/:slug", verifyToken, PhysicalProduct.updateProductByAdmin);

router.delete("/admin/physical-products/:slug", verifyToken, PhysicalProduct.deletedProductByAdmin);

/*
============================================
Physical Product (user)
============================================
*/ 
router.get("/user/physical-products", UserPhysicalProduct.getProducts);
router.get("/user/physical-products/filters", UserPhysicalProduct.getFilters);
router.get("/user/physical-filters/:shop/:category", UserPhysicalProduct.getFiltersByCategory);
router.get("/user/physical-filters/:shop/:category/:subcategory", UserPhysicalProduct.getFiltersBySubCategory);
router.get("/user/physical-products/:slug", UserPhysicalProduct.getOneProductBySlug);
router.get("/user/physical-products-slugs", UserPhysicalProduct.getAllProductSlug);
router.get("/user/related-physical-products/:pid", UserPhysicalProduct.relatedProducts);
router.post("/user/compare/physical-products", UserPhysicalProduct.getCompareProducts);

module.exports = router;
