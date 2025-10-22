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

/* ===========================
   PUBLIC ROUTES (Optional)
   =========================== */

// Get all physical products (for users)
router.get("/physical-products", UserPhysicalProduct.getPhysicalProducts);

// Get single physical product by slug (for users)
router.get("/physical-products/:slug", UserPhysicalProduct.getOneProductBySlug);

module.exports = router;
