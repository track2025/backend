// routes/physical-product-routes.js

const express = require("express");
const router = express.Router();

// Controllers
const PhysicalProduct = require("../controllers/physical-product-controller");
const UserPhysicalProduct = require("../controllers/user/physical-product-controller");

// Middleware
const verifyToken = require("../config/jwt");

/* ===========================
   ADMIN ROUTES (Protected)
   =========================== */
router.post(
  "/admin/physical-products",
  verifyToken,
  PhysicalProduct.createPhysicalProductByAdmin
);

router.get(
  "/admin/physical-products",
  verifyToken,
  PhysicalProduct.getPhysicalProductsByAdmin
);

router.get(
  "/admin/physical-products/:slug",
  verifyToken,
  PhysicalProduct.getOnePhysicalProductByAdmin
);

router.put(
  "/admin/physical-products/:slug",
  verifyToken,
  PhysicalProduct.updatePhysicalProductByAdmin
);

router.delete(
  "/admin/physical-products/:slug",
  verifyToken,
  PhysicalProduct.deletePhysicalProductByAdmin
);

/* 
===========================
 Physical Products (User)
=========================== 
*/

router.get("/user/physical-products", UserPhysicalProduct.getProducts);
router.get("/user/physical-products/filters", UserPhysicalProduct.getFilters);
router.get("/user/physical-filters/:shop/:category", UserPhysicalProduct.getFiltersByCategory);
router.get(
  "/user/physical-filters/:category/:subcategory",
  UserPhysicalProduct.getFiltersBySubCategory
);
router.get("/user/physical-products/:slug", UserPhysicalProduct.getOneProductBySlug);
router.get("/user/physical-products-slugs", UserPhysicalProduct.getAllProductSlug);
router.get("/user/related-physical-products/:pid", UserPhysicalProduct.relatedProducts);
router.post("/user/compare/physical-products", UserPhysicalProduct.getCompareProducts);

module.exports = router;
