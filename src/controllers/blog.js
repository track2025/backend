const Blogs = require("../models/Blog");
const getBlurDataURL = require("../config/getBlurDataURL");
const { singleFileDelete } = require("../config/uploader");

const getAllBlogs = async (req, res) => {
  try {
    const blogs = await Blogs.find().sort({
      createdAt: -1,
    });
    res.status(201).json({
      success: true,
      data: blogs,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllBlogs,
};
