const express = require("express");
const router = express.Router();
const slideController = require("../controllers/slide");
const verifyToken = require("../config/jwt");

// ✅ Admin slide routes
router.get("/admin/slides", verifyToken, slideController.getSlidesByAdmin);
router.get("/admin/slides/:slug", verifyToken, slideController.getSlideByAdmin);
router.post("/admin/slides", verifyToken, slideController.createSlide);
router.put("/admin/slides/:slug", verifyToken, slideController.updateSlideBySlug);
router.delete("/admin/slides/:slug", verifyToken, slideController.deleteSlideBySlug);

router.put("/admin/slides/active/:slug", verifyToken, slideController.updateSlideActiveInactiveByAdmin);

module.exports = router;
