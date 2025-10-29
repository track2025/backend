const PhysicalBrand = require("../models/PhysicalBrand");
const PhysicalProduct = require("../models/PhysicalProduct");
const PhysicalCategory = require("../models/PhysicalCategory");
const { multiFilesDelete } = require("../config/uploader");

/*  Create a new product by admin */
const createProductByAdmin = async (req, res) => {
  try {
    const body = req.body;

    const data = await PhysicalProduct.create({
      ...body,
      likes: 0,
    });

    res.status(201).json({
      success: true,
      message: "Physical Product Created",
      data: data,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/*   Get All Products by Admin (Protected)    */
const getProductsByAdmin = async (req, res) => {
  try {
    const {
      status: statusQuery,
      page: pageQuery,
      limit: limitQuery,
      search: searchQuery,
      category,
      brand,
    } = req.query;

    const limit = parseInt(limitQuery) || 10;
    const page = parseInt(pageQuery) || 1;

    const skip = limit * (page - 1);

    let matchQuery = {};
    if (statusQuery === "lowstock") {
      matchQuery.$or = [
        {
          $and: [{ type: "simple" }, { stockQuantity: { $lt: 30 } }],
        },
        {
          $and: [
            { type: "variable" },
            { "variants.stockQuantity": { $lt: 30 } },
          ],
        },
      ];
    } else if (statusQuery) {
      matchQuery.status = statusQuery;
    }

    if (category) {
      const currentCategory = await PhysicalCategory.findOne({
        slug: category,
      }).select(["slug", "_id"]);

      matchQuery.category = currentCategory._id;
    }

    if (brand) {
      const currentBrand = await PhysicalBrand.findOne({
        slug: brand,
      }).select(["slug", "_id"]);

      matchQuery.brand = currentBrand._id;
    }

    const totalProducts = await PhysicalProduct.countDocuments({
      name: { $regex: searchQuery || "", $options: "i" },
      ...matchQuery,
    });

    const products = await PhysicalProduct.aggregate([
      {
        $match: {
          name: { $regex: searchQuery || "", $options: "i" },
          ...matchQuery,
        },
      },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: "reviews",
          localField: "reviews",
          foreignField: "_id",
          as: "reviews",
        },
      },
      {
        $addFields: {
          averageRating: { $avg: "$reviews.rating" },
          image: { $arrayElemAt: ["$images", 0] },
          variantWithLeastStock: {
            $reduce: {
              input: "$variants",
              initialValue: {
                stockQuantity: Number.MAX_VALUE,
                price: null,
                salePrice: null,
              },
              in: {
                $cond: [
                  { $lt: ["$$this.stockQuantity", "$$value.stockQuantity"] },
                  {
                    stockQuantity: "$$this.stockQuantity",
                    price: "$$this.price",
                    salePrice: "$$this.salePrice",
                  },
                  "$$value",
                ],
              },
            },
          },
        },
      },
      {
        $addFields: {
          stockQuantity: {
            $cond: [
              { $eq: ["$type", "variable"] },
              "$variantWithLeastStock.stockQuantity",
              "$stockQuantity",
            ],
          },
          price: {
            $cond: [
              { $eq: ["$type", "variable"] },
              "$variantWithLeastStock.price",
              "$price",
            ],
          },
          salePrice: {
            $cond: [
              { $eq: ["$type", "variable"] },
              "$variantWithLeastStock.salePrice",
              "$salePrice",
            ],
          },
        },
      },
      {
        $project: {
          image: { url: "$image.url" },
          name: 1,
          slug: 1,
          status: 1,

          isFeatured: 1,
          discount: 1,
          likes: 1,
          salePrice: 1,
          price: 1,
          averageRating: 1,
          stockQuantity: 1,
          createdAt: 1,
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: products,
      total: totalProducts,
      count: Math.ceil(totalProducts / limit),
      currentPage: page,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/*   Get Single Product by ID (Admin Protected)    */
const getOneProductByAdmin = async (req, res) => {
  try {
    // Find the product and populate its brand, category, subCategory, and reviews
    const product = await PhysicalProduct.findOne({ slug: req.params.slug })
      .populate([
        { path: "brand", select: "name slug _id" },
        { path: "category", select: "name slug _id" },
        { path: "subCategory", select: "name slug _id" },
        { path: "reviews", select: "rating comment user" }
      ])
      .lean();

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Compute rating statistics
    const totalReviews = product.reviews?.length || 0;
    const totalRating =
      totalReviews > 0
        ? product.reviews.reduce((acc, r) => acc + (r.rating || 0), 0) /
          totalReviews
        : 0;

    // Respond with full structured data
    return res.status(200).json({
      success: true,
      data: {
        ...product,
        brand: product.brand
          ? {
              _id: product.brand._id,
              name: product.brand.name,
              slug: product.brand.slug,
            }
          : null,
        category: product.category
          ? {
              _id: product.category._id,
              name: product.category.name,
              slug: product.category.slug,
            }
          : null,
        subCategory: product.subCategory
          ? {
              _id: product.subCategory._id,
              name: product.subCategory.name,
              slug: product.subCategory.slug,
            }
          : null,
        totalRating,
        totalReviews,
      },
    });
  } catch (error) {
    console.error("Error fetching product:", error);
    return res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};


/*     Update Product by ID (Admin Protected)    */
const updateProductByAdmin = async (req, res) => {
  try {
    const { slug } = req.params;

    const updated = await PhysicalProduct.findOneAndUpdate(
      { slug: slug },
      {
        ...req.body,
      },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      data: updated,
      message: "Physical Product Updated",
    });
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
};

/*     Delete Product by ID (Admin Protected)    */
const deletedProductByAdmin = async (req, res) => {
  try {
    const slug = req.params.slug;
    const product = await PhysicalProduct.findOne({ slug: slug });
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Physical Product Not Found",
      });
    }

    if (product && product.images && product.images.length > 0) {
      await multiFilesDelete(req, product.images);
    }
    const deleteProduct = await PhysicalProduct.deleteOne({ slug: slug });
    if (!deleteProduct) {
      return res.status(400).json({
        success: false,
        message: "Product Deletion Failed",
      });
    }
    return res.status(204).json({
      success: true,
      message: "Physical Product Deleted ",
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  createProductByAdmin,
  getProductsByAdmin,
  getOneProductByAdmin,
  updateProductByAdmin,
  deletedProductByAdmin,
};
