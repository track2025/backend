const express = require("express");
const router = express.Router();
const physicalProduct = require("../controllers/physical-product-controller");

// Import verifyToken function
const verifyToken = require("../config/jwt");

// Admin routes
router.post(
  "/admin/physical-products",
  verifyToken,
  physicalProduct.createProductByAdmin
);
router.get("/admin/products", verifyToken, physicalProduct.getProductsByAdmin);
router.get(
  "/admin/products/:slug",
  verifyToken,
  physicalProduct.getProductBySlugByAdmin
);
router.put(
  "/admin/products/:slug",
  verifyToken,
  physicalProduct.updateProductBySlugByAdmin
);
router.delete(
  "/admin/products/:slug",
  verifyToken,
  physicalProduct.deleteProductBySlugByAdmin
);

// User routes
router.get("/products", physicalProduct.getProducts);
router.get("/products/:slug", physicalProduct.getOneProductBySlug);

module.exports = router;
