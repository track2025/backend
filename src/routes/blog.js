const express = require("express");
const router = express.Router();
const blog = require("../controllers/blog");

// Import verifyToken function
const verifyToken = require("../config/jwt");

// admin routes

router.get("/admin/blogs", verifyToken, blog.getAllBlogs);

module.exports = router;
