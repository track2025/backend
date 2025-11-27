const Attribute = require("../../models/Attribute");
const PhysicalBrand = require("../../models/PhysicalBrand");
const PhysicalCategory = require("../../models/PhysicalCategory");
const PhysicalProduct = require("../../models/PhysicalProduct");
const PhysicalSubCategory = require("../../models/PhysicalSubCategory");
const Review = require("../../models/Review");

const getFilters = async (req, res) => {
  try {
    const products = await PhysicalProduct.find({
      status: "published",
    }).select(["type", "price", "variants", "brand"]);

    let prices = [];
    let brandIds = new Set();

    for (const product of products) {
      if (product.brand) brandIds.add(product.brand.toString());

      if (product.type === "simple") {
        if (typeof product.price === "number") prices.push(product.price);
      } else if (product.type === "variable") {
        const variantPrices = product.variants
          .filter((v) => typeof v.price === "number")
          .map((v) => v.price);
        prices.push(...variantPrices);
      }
    }

    // Get min & max prices
    const min = prices.length ? Math.min(...prices) : 0;
    const max = prices.length ? Math.max(...prices) : 100000;

    const attributes = await Attribute.find({});
    const brands = await PhysicalBrand.find({
      status: { $ne: "inactive" },
      _id: { $in: Array.from(brandIds) },
    }).select("name slug");

    res.status(200).json({
      success: true,
      data: {
        attributes,
        prices: [min, max],
        brands,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
/*     Get Filters by Category Slug (Public)    */
const getFiltersByCategory = async (req, res) => {
  try {
    const { category } = req.params;

    const categoryData = await PhysicalCategory.findOne({
      slug: category,
    }).select("_id name");
    if (!categoryData) {
      return res
        .status(404)
        .json({ success: false, message: "Category Not Found" });
    }

    const products = await PhysicalProduct.find({
      status: "published",
      category: categoryData._id,
    }).select(["type", "price", "variants", "brand"]);

    let prices = [];
    let brandIds = new Set();

    for (const product of products) {
      // Collect brandId
      if (product.brand) brandIds.add(product.brand.toString());

      // Collect price based on type
      if (product.type === "simple") {
        if (typeof product.price === "number") prices.push(product.price);
      } else if (product.type === "variable") {
        const variantPrices = product.variants
          .filter((v) => typeof v.price === "number")
          .map((v) => v.price);
        prices.push(...variantPrices);
      }
    }

    // Get min & max prices
    const min = prices.length ? Math.min(...prices) : 0;
    const max = prices.length ? Math.max(...prices) : 100000;

    // Fetch attributes & brands
    const attributes = await Attribute.find({});
    const brands = await PhysicalBrand.find({
      status: { $ne: "inactive" },
      _id: { $in: Array.from(brandIds) },
    }).select("name slug");

    res.status(200).json({
      success: true,
      data: {
        attributes,
        prices: [min, max],
        brands,
      },
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
/*     Get Filters by SubCategory Slug (Public)    */
const getFiltersBySubCategory = async (req, res) => {
  try {
    const { category, subcategory } = req.params;

    const categoryData = await PhysicalCategory.findOne({
      slug: category,
    }).select(["_id", "name"]);
    if (!categoryData) {
      return res
        .status(404)
        .json({ success: false, message: "Category Not Found" });
    }
    // Fetch subcategory data
    const subcategoryData = await PhysicalSubCategory.findOne({
      slug: subcategory,
      parentCategory: categoryData._id,
    }).select(["_id"]);
    if (!subcategoryData) {
      return res
        .status(404)
        .json({ success: false, message: "Subcategory Not Found" });
    }

    // Find products based on subCategory
    const products = await PhysicalProduct.find({
      status: "published",
      subCategory: subcategoryData._id,
    }).select(["type", "price", "variants", "brand"]);

    let prices = [];
    let brandIds = new Set();

    for (const product of products) {
      // Collect brandId
      if (product.brand) brandIds.add(product.brand.toString());

      // Collect price based on type
      if (product.type === "simple") {
        if (typeof product.price === "number") prices.push(product.price);
      } else if (product.type === "variable") {
        const variantPrices = product.variants
          .filter((v) => typeof v.price === "number")
          .map((v) => v.price);
        prices.push(...variantPrices);
      }
    }

    // Get min & max prices
    const min = prices.length ? Math.min(...prices) : 0;
    const max = prices.length ? Math.max(...prices) : 100000;

    // Fetch attributes & brands
    const attributes = await Attribute.find({});
    const brands = await PhysicalBrand.find({
      status: { $ne: "inactive" },
      _id: { $in: Array.from(brandIds) },
    }).select("name slug");

    res.status(200).json({
      success: true,
      data: {
        attributes,
        prices: [min, max],
        brands,
      },
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
/*     Get All Product Slugs (Public)    */
const getAllProductSlug = async (req, res) => {
  try {
    const products = await PhysicalProduct.find().select("slug");

    return res.status(200).json({
      success: true,
      data: products,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};
/*    Get Related Products (Public)    */
const relatedProducts = async (req, res) => {
  try {
    const pid = req.params.pid;
    const product = await PhysicalProduct.findById(pid).select("_id category");

    const related = await PhysicalProduct.aggregate([
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
        $match: {
          category: product.category,
          _id: { $ne: product._id },
          status: "published",
        },
      },
      {
        $limit: 8,
      },
      {
        $project: {
          images: 1,
          name: 1,
          slug: 1,

          type: 1,
          discount: 1,
          likes: 1,
          salePrice: 1,
          price: 1,
          averageRating: 1,
          stockQuantity: 1,
          vendor: 1,
          createdAt: 1,
        },
      },
    ]);

    res.status(200).json({ success: true, data: related });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
/*     Get One Product by Slug (Public)    */
const getOneProductBySlug = async (req, res) => {
  try {
    const product = await PhysicalProduct.findOne({ slug: req.params.slug })
      .populate({
        path: "category",
        select: "name slug",
      })
      .populate({
        path: "subCategory",
        select: "name slug",
      })
      .populate({
        path: "brand",
        select: "name slug",
      });

    const getProductRatingAndReviews = async () => {
      const product = await PhysicalProduct.aggregate([
        {
          $match: { slug: req.params.slug },
        },
        {
          $lookup: {
            from: "physicalreviews",
            localField: "reviews",
            foreignField: "_id",
            as: "reviews",
          },
        },
        {
          $project: {
            _id: 0,
            totalReviews: { $size: "$reviews" },
            averageRating: {
              $avg: "$reviews.rating",
            },
          },
        },
      ]);

      return product[0];
    };

    const reviewReport = await getProductRatingAndReviews();
    return res.status(200).json({
      success: true,
      data: product,
      totalReviews: reviewReport.totalReviews,
      totalRating: reviewReport.averageRating || 0,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getCompareProducts = async (req, res) => {
  try {
    const fetchedProducts = await PhysicalProduct.find({
      _id: { $in: req.body.products },
      status: "published",
    }).select(["_id"]);

    const products = await PhysicalProduct.aggregate([
      {
        $match: {
          _id: { $in: fetchedProducts.map((v) => v._id) },
          status: "published",
        },
      },
      {
        $lookup: {
          from: "physicalreviews",
          localField: "reviews",
          foreignField: "_id",
          as: "reviews",
        },
      },
      // 🔎 Lookup brand
      {
        $lookup: {
          from: "physicalbrands",
          localField: "brand",
          foreignField: "_id",
          as: "brand",
        },
      },
      { $unwind: { path: "$brand", preserveNullAndEmptyArrays: true } },

      // 🔎 Lookup category
      {
        $lookup: {
          from: "physicalcategories",
          localField: "category",
          foreignField: "_id",
          as: "category",
        },
      },
      { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },

      // 🔎 Lookup subCategory
      {
        $lookup: {
          from: "physicalsubcategories",
          localField: "subCategory",
          foreignField: "_id",
          as: "subCategory",
        },
      },
      { $unwind: { path: "$subCategory", preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          averageRating: { $avg: "$reviews.rating" },
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
          variants: {
            $map: {
              input: "$variants",
              as: "v",
              in: {
                _id: "$$v._id",
                name: "$$v.name",
                variant: "$$v.variant",
                price: "$$v.price",
                salePrice: "$$v.salePrice",
                stockQuantity: "$$v.stockQuantity",
              },
            },
          },
        },
      },
      {
        $project: {
          images: 1,
          name: 1,
          slug: 1,
          variants: 1,
          discount: 1,
          likes: 1,
          type: 1,
          salePrice: 1,
          price: 1,
          averageRating: 1,
          stockQuantity: 1,
          vendor: 1,
          createdAt: 1,
          "brand.name": 1,
          "category.name": 1,
          "subCategory.name": 1,
        },
      },
    ]);

    console.info("Product Details:", products);

    return res.status(201).json({
      success: true,
      data: products,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/*     Get Products (Public)    */
const getProducts = async (req, res) => {
  try {
    delete req.query._t;

    const {
      page = 1,
      limit = 12,
      name,
      top,
      date,
      price: sortPrice,
      category,
      subcategory,
      brand,
      isFeatured,
      prices,
      ...rest
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const matchStage = { status: "published" };

    // Category filter
    if (category) {
      const categoryDoc = await PhysicalCategory.findOne({ slug: category });
      if (!categoryDoc)
        return res.json({ success: true, data: [], total: 0, count: 0 });
      matchStage.category = categoryDoc._id;
    }

    // Subcategory filter
    if (subcategory) {
      const subDoc = await PhysicalSubCategory.findOne({ slug: subcategory });
      if (!subDoc)
        return res.json({ success: true, data: [], total: 0, count: 0 });
      matchStage.subCategory = subDoc._id;
    }

    // Brand filter
    if (brand) {
      const brandDoc = await PhysicalBrand.findOne({ slug: brand });
      if (!brandDoc)
        return res.json({ success: true, data: [], total: 0, count: 0 });
      matchStage.brand = brandDoc._id;
    }

    if (isFeatured !== undefined) {
      matchStage.isFeatured = isFeatured === "true";
    }

    // Price range filter
    if (prices && prices.includes("_")) {
      const [min, max] = prices.split("_").map(Number);
      if (!isNaN(min) && !isNaN(max)) {
        matchStage.salePrice = { $gte: min, $lte: max };
      }
    }

    // Dynamic variant filters (optional)
    const variantConditions = [];
    for (const key in rest) {
      const values = rest[key].split("_");
      variantConditions.push({
        "variants.variant": { $regex: new RegExp(`(^|/)${key}(/|$)`, "i") },
      });
      variantConditions.push({
        "variants.name": { $regex: new RegExp(`(${values.join("|")})`, "i") },
      });
    }

    const pipeline = [
      { $match: matchStage },

      // Apply variant filters if any
      ...(variantConditions.length
        ? [{ $match: { $and: variantConditions } }]
        : []),

      // Lookup reviews
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

      // For variable products, pick the first in-stock variant
      {
        $addFields: {
          firstInStockVariant: {
            $arrayElemAt: [
              {
                $filter: {
                  input: "$variants",
                  as: "v",
                  cond: { $gt: ["$$v.stockQuantity", 0] },
                },
              },
              0,
            ],
          },
        },
      },

      // Project final fields
      {
        $project: {
          _id: 1,
          name: 1,
          slug: 1,
          type: 1,
          price: {
            $cond: [
              { $eq: ["$type", "variable"] },
              "$firstInStockVariant.price",
              "$price",
            ],
          },
          salePrice: {
            $cond: [
              { $eq: ["$type", "variable"] },
              "$firstInStockVariant.salePrice",
              "$salePrice",
            ],
          },
          stockQuantity: {
            $cond: [
              { $eq: ["$type", "variable"] },
              "$firstInStockVariant.stockQuantity",
              "$stockQuantity",
            ],
          },
          createdAt: 1,
          images: 1,
          averageRating: 1,
        },
      },

      // Sorting
      {
        $sort: (() => {
          const sortObj = {};
          if (sortPrice) sortObj.salePrice = parseInt(sortPrice);
          if (date) sortObj.createdAt = parseInt(date);
          if (top) sortObj.averageRating = parseInt(top);
          if (name) sortObj.name = parseInt(name);
          return Object.keys(sortObj).length ? sortObj : { createdAt: -1 };
        })(),
      },

      // Pagination
      { $skip: skip },
      { $limit: parseInt(limit) },
    ];

    const products = await PhysicalProduct.aggregate(pipeline);

    // Total count
    const total = await PhysicalProduct.countDocuments(matchStage);
    const count = Math.ceil(total / parseInt(limit));

    res.json({
      success: true,
      data: products,
      total,
      count,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};






module.exports = {
  getProducts,
  getFilters,
  getFiltersByCategory,
  getFiltersBySubCategory,
  getAllProductSlug,
  relatedProducts,
  getOneProductBySlug,
  getCompareProducts,
};
