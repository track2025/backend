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

    // Handle status query
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

    // Handle category filter
    if (category) {
      const currentCategory = await PhysicalCategory.findOne({
        slug: category,
      }).select(["_id"]);

      if (currentCategory) {
        matchQuery.category = currentCategory._id;
      }
    }

    // Handle brand filter
    if (brand) {
      const currentBrand = await PhysicalBrand.findOne({
        slug: brand,
      }).select(["_id"]);

      if (currentBrand) {
        matchQuery.brand = currentBrand._id;
      }
    }

    // Base search query
    const searchMatch = searchQuery
      ? { name: { $regex: searchQuery, $options: "i" } }
      : {};

    const totalProducts = await PhysicalProduct.countDocuments({
      ...searchMatch,
      ...matchQuery,
    });

    const products = await PhysicalProduct.aggregate([
      {
        $match: {
          ...searchMatch,
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
    console.error("Error fetching products by admin:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching products",
      error: process.env.NODE_ENV === 'production' ? undefined : error.message
    });
  }
};

/* Get Products by Category */
const getProductsByCategory = async (req, res) => {
  try {
    const { query, params } = req;
    const { category: categorySlug } = params;

    // ✅ Validate category
    const category = await PhysicalCategory.findOne({ slug: categorySlug }).select("_id slug");
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // ✅ Build filter query
    const filterQuery = buildFilterQuery(query, category._id);

    const limit = parseInt(query.limit) || 12;
    const page = parseInt(query.page) || 1;
    const skip = limit * (page - 1);

    // ✅ Get total count
    const totalProducts = await PhysicalProduct.countDocuments(filterQuery);

    // ✅ Aggregate products
    const products = await PhysicalProduct.aggregate([
      { $match: filterQuery },
      {
        $lookup: {
          from: "reviews",
          localField: "reviews",
          foreignField: "_id",
          as: "reviewDetails",
        },
      },
      {
        $addFields: {
          averageRating: {
            $cond: [
              { $gt: [{ $size: "$reviewDetails" }, 0] },
              { $avg: "$reviewDetails.rating" },
              0,
            ],
          },
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          slug: 1,
          type: 1,
          images: 1,
          price: 1,
          salePrice: 1,
          stockQuantity: 1,
          averageRating: 1,
          createdAt: 1,
          variant: {
            $cond: [{ $eq: ["$type", "variable"] }, "$variants", null],
          },
        },
      },
      { $skip: skip },
      { $limit: limit },
    ]);

    // ✅ Normalize variable products (flatten variants)
    const normalizedProducts = products.map((product) => {
      if (product.type === "variable" && Array.isArray(product.variant) && product.variant.length > 0) {
        const variant = product.variant[0];
        return {
          ...product,
          price: variant.price ?? product.price,
          salePrice: variant.salePrice ?? product.salePrice,
          stockQuantity: variant.stockQuantity ?? product.stockQuantity,
          images: variant.images?.length ? variant.images : product.images,
          variant: variant.name ?? null,
        };
      }
      return {
        ...product,
        salePrice: product.salePrice ?? product.price, // fallback if missing
      };
    });

    // ✅ Return consistent structure (matches getProducts)
    return res.status(200).json({
      success: true,
      message: "Products fetched successfully",
      data: normalizedProducts,
      total: totalProducts, // total count for pagination
      count: Math.ceil(totalProducts / limit),
      currentPage: page,
      limit,
    });
  } catch (error) {
    console.error("Error fetching products by category:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching products",
      error: process.env.NODE_ENV === 'production' ? undefined : error.message,
    });
  }
};



/* Get Products by SubCategory */
const getProductsBySubCategory = async (req, res) => {
  try {
    const query = req.query;
    const subCategorySlug = req.params.subcategory;

    // Note: You'll need to import and use the correct SubCategory model
    // const subCategory = await SubCategory.findOne({ slug: subCategorySlug }).select("_id slug");
    // For now, using PhysicalCategory as placeholder
    const subCategory = await PhysicalCategory.findOne({ slug: subCategorySlug }).select("_id slug");

    if (!subCategory) {
      return res.status(404).json({
        success: false,
        message: "SubCategory not found",
      });
    }

    // Build filter query for subcategory
    const filterQuery = buildFilterQuery(query, null, subCategory._id);

    const limit = parseInt(query.limit) || 12;
    const page = parseInt(query.page) || 1;
    const skip = limit * (page - 1);

    const totalProducts = await PhysicalProduct.countDocuments(filterQuery);
    const products = await getProductsAggregation(filterQuery, query, skip, limit);

    res.status(200).json({
      success: true,
      data: products,
      total: totalProducts,
      count: Math.ceil(totalProducts / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error("Error fetching products by subcategory:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching products",
      error: process.env.NODE_ENV === 'production' ? undefined : error.message
    });
  }
};

/* Helper function to build filter query */
const buildFilterQuery = (query, categoryId = null, subCategoryId = null) => {
  const filterQuery = {
    status: { $ne: "disabled" }
  };

  // Add category/subcategory filter
  if (categoryId) {
    filterQuery.category = categoryId;
  }
  if (subCategoryId) {
    filterQuery.subCategory = subCategoryId;
  }

  // Add brand filter
  if (query.brand) {
    // Note: You'll need to implement brand lookup similar to category
  }

  // Add size filter
  if (query.sizes) {
    filterQuery.sizes = { $in: query.sizes.split("_") };
  }

  // Add color filter
  if (query.colors) {
    filterQuery.colors = { $in: query.colors.split("_") };
  }

  // Add price range filter
  if (query.prices) {
    const rate = Number(query.rate) || 1;
    const [minPrice, maxPrice] = query.prices.split("_").map(price => Number(price) / rate);

    filterQuery.priceSale = {
      $gt: minPrice,
      $lt: maxPrice,
    };
  }

  // Add featured filter
  if (query.isFeatured) {
    filterQuery.isFeatured = Boolean(query.isFeatured);
  }

  return filterQuery;
};

/* Helper function for products aggregation */
const getProductsAggregation = (filterQuery, query, skip, limit) => {
  const sortStage = buildSortStage(query);

  return PhysicalProduct.aggregate([
    {
      $lookup: {
        from: "productreviews",
        localField: "reviews",
        foreignField: "_id",
        as: "reviews",
      },
    },
    {
      $addFields: {
        averageRating: { $avg: "$reviews.rating" },
        image: { $arrayElemAt: ["$images", 0] },
      },
    },
    {
      $match: filterQuery,
    },
    {
      $project: {
        image: { url: "$image.url", blurDataURL: "$image.blurDataURL" },
        name: 1,
        available: 1,
        slug: 1,
        colors: 1,
        discount: 1,
        likes: 1,
        priceSale: 1,
        available: 1,
        price: 1,
        currency: 1,
        averageRating: 1,
        vendor: 1,
        shop: 1,
        createdAt: 1,
      },
    },
    {
      $sort: sortStage,
    },
    {
      $skip: skip,
    },
    {
      $limit: limit,
    },
  ]);
};

/* Helper function to build sort stage */
const buildSortStage = (query) => {
  if (query.date) {
    return { createdAt: Number(query.date) };
  }
  if (query.price) {
    return { priceSale: Number(query.price) };
  }
  if (query.name) {
    return { name: Number(query.name) };
  }
  if (query.top) {
    return { averageRating: Number(query.top) };
  }
  return { averageRating: -1 }; // Default sort
};

/*   Get Single Product by ID (Admin Protected)    */
const getOneProductByAdmin = async (req, res) => {
  try {
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
    const totalRating = totalReviews > 0
      ? product.reviews.reduce((acc, r) => acc + (r.rating || 0), 0) / totalReviews
      : 0;

    return res.status(200).json({
      success: true,
      data: {
        ...product,
        brand: product.brand ? {
          _id: product.brand._id,
          name: product.brand.name,
          slug: product.brand.slug,
        } : null,
        category: product.category ? {
          _id: product.category._id,
          name: product.category.name,
          slug: product.category.slug,
        } : null,
        subCategory: product.subCategory ? {
          _id: product.subCategory._id,
          name: product.subCategory.name,
          slug: product.subCategory.slug,
        } : null,
        totalRating,
        totalReviews,
      },
    });
  } catch (error) {
    console.error("Error fetching product:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching product",
      error: process.env.NODE_ENV === 'production' ? undefined : error.message
    });
  }
};

/* Update Product by ID (Admin Protected) */
const updateProductByAdmin = async (req, res) => {
  try {
    const { slug } = req.params;

    const updated = await PhysicalProduct.findOneAndUpdate(
      { slug: slug },
      { ...req.body },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: updated,
      message: "Physical Product Updated",
    });
  } catch (error) {
    console.error("Error updating product:", error);
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/* Delete Product by ID (Admin Protected) */
const deletedProductByAdmin = async (req, res) => {
  try {
    const { slug } = req.params;

    const product = await PhysicalProduct.findOne({ slug: slug });
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Physical Product Not Found",
      });
    }

    // Delete associated images
    if (product.images && product.images.length > 0) {
      await multiFilesDelete(req, product.images);
    }

    const deleteResult = await PhysicalProduct.deleteOne({ slug: slug });

    if (deleteResult.deletedCount === 0) {
      return res.status(400).json({
        success: false,
        message: "Product Deletion Failed",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Physical Product Deleted Successfully",
    });
  } catch (error) {
    console.error("Error deleting product:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while deleting product",
      error: process.env.NODE_ENV === 'production' ? undefined : error.message
    });
  }
};

module.exports = {
  createProductByAdmin,
  getProductsByAdmin,
  getOneProductByAdmin,
  updateProductByAdmin,
  deletedProductByAdmin,
  getProductsByCategory,
  getProductsBySubCategory,
};