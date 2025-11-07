const Blogs = require("../models/Blog");
const getBlurDataURL = require("../config/getBlurDataURL");
const { singleFileDelete } = require("../config/uploader");

const getAllBlogs = async (req, res) => {
  try {
    const {
      limit = 10,
      page = 1,
      search = "",
      category,
      status,
      author,
    } = req.query;

    const skip = parseInt(limit);
    const pageNumber = parseInt(page) || 1;

    // Build dynamic search query
    let filter = {
      $or: [
        { title: { $regex: search, $options: "i" } },
        { metaTitle: { $regex: search, $options: "i" } },
        { author: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
      ],
    };

    if (category) filter.category = category;
    if (status) filter.status = status;
    if (author) filter.author = author;

    // Count total matching blogs
    const totalBlogs = await Blogs.countDocuments(filter);

    // Fetch paginated blogs
    const blogs = await Blogs.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip * (pageNumber - 1))
      .limit(skip);

    res.status(200).json({
      success: true,
      data: blogs,
      total: totalBlogs,
      count: Math.ceil(totalBlogs / skip),
      currentPage: pageNumber,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAllBlogsUser = async (req, res) => {
  try {
    const {
      limit = 10,
      page = 1,
      search = "",
      category,
      status,
      author,
    } = req.query;

    const limitNumber = parseInt(limit);
    const pageNumber = parseInt(page) || 1;
    const skip = limitNumber * (pageNumber - 1); // Calculate documents to skip

    // Build dynamic search query
    let filter = {
      $or: [
        { title: { $regex: search, $options: "i" } },
        { metaTitle: { $regex: search, $options: "i" } },
        { author: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
      ],
      status: "published",
    };

    if (category) filter.category = category;
    if (status) filter.status = status;
    if (author) filter.author = author;

    // Count total matching published blogs
    const totalBlogs = await Blogs.countDocuments(filter);

    // Fetch paginated published blogs
    const blogs = await Blogs.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNumber);

    res.status(200).json({
      success: true,
      data: blogs,
      total: totalBlogs,
      count: Math.ceil(totalBlogs / limitNumber), // Total pages
      currentPage: pageNumber,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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
  getAllBlogsUser,
};
