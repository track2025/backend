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

const getBlogBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const blog = await Blogs.findOne({ slug });

    if (!blog) {
      return res.status(404).json({ message: "Blog Not Found" });
    }

    return res.status(201).json({
      success: true,
      data: blog,
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const updateBlogBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const { slug: skipSlug, featuredImage, heroImage, ...others } = req.body;

    // ✅ Generate blurDataURL if missing for featuredImage
    if (featuredImage && !featuredImage.blurDataURL) {
      featuredImage.blurDataURL = await getBlurDataURL(featuredImage.url);
    }

    // ✅ Generate blurDataURL if missing for heroImage
    if (heroImage && !heroImage.blurDataURL) {
      heroImage.blurDataURL = await getBlurDataURL(heroImage.url);
    }

    // ✅ Update blog
    await Blogs.findOneAndUpdate(
      { slug },
      {
        ...others,
        ...(featuredImage && { featuredImage }),
        ...(heroImage && { heroImage }),
      },
      { new: true, runValidators: true }
    );

    res.status(201).json({ success: true, message: "Blog Updated" });
  } catch (error) {
    console.error("Error updating blog:", error);
    res.status(400).json({ success: false, message: error.message });
  }
};

const deleteBlogBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const brand = await Blogs.findOne({ slug });

    if (!brand) {
      return res.status(404).json({ message: "Blog Not Found" });
    }

    await Blogs.deleteOne({ slug });

    res.status(201).json({ success: true, message: "Blog Deleted" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  getAllBlogs,
  addBlogByAdmin,
  getBlogBySlug,
  updateBlogBySlug,
  deleteBlogBySlug,
};
