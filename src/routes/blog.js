const express = require("express");
const router = express.Router();
const blog = require("../controllers/blog");

// Import verifyToken function
const verifyToken = require("../config/jwt");

// admin routes

router.get("/admin/blogs", verifyToken, blog.getAllBlogs);
router.post("/admin/blogs", verifyToken, blog.addBlogByAdmin);

module.exports = router;
