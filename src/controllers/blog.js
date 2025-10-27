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

const addBlogByAdmin = async (req, res) => {
  try {
    const { featuredImage, heroImage, ...rest } = req.body;

    // ✅ Validate image presence
    if (!featuredImage || !featuredImage.url) {
      return res
        .status(400)
        .json({ success: false, message: "Featured image is required" });
    }
    if (!heroImage || !heroImage.url) {
      return res
        .status(400)
        .json({ success: false, message: "Hero image is required" });
    }

    // ✅ Generate blurDataURL for both images
    const [featuredBlur, heroBlur] = await Promise.all([
      getBlurDataURL(featuredImage.url),
      getBlurDataURL(heroImage.url),
    ]);

    // ✅ Create new blog
    await Blogs.create({
      ...rest,
      featuredImage: {
        ...featuredImage,
        blurDataURL: featuredBlur,
      },
      heroImage: {
        ...heroImage,
        blurDataURL: heroBlur,
      },
    });

    res
      .status(201)
      .json({ success: true, message: "Blog Created Successfully" });
  } catch (error) {
    console.error("Error creating blog:", error);
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllBlogs,
  addBlogByAdmin,
};
