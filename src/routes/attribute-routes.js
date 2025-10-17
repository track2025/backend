const express = require("express");
const router = express.Router();
const Attribute = require("../controllers/attribute-controller");
const verifyToken = require("../config/jwt");

router.post("/admin/attributes", verifyToken, Attribute.createAttributeByAdmin);

router.get("/admin/attributes", verifyToken, Attribute.getAttributesByAdmin);

router.get(
  "/admin/attributes/:id",
  verifyToken,
  Attribute.getAttributeByIdByAdmin
);

router.put(
  "/admin/attributes/:id",
  verifyToken,
  Attribute.updateAttributeByIdByAdmin
);

router.delete(
  "/admin/attributes/:id",
  verifyToken,
  Attribute.deleteAttributeByIdByAdmin
);

router.get("/admin/all-attributes", Attribute.getAllAttributesByAdmin);

module.exports = router;
