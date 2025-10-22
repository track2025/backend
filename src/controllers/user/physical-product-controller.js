// controllers/public/physical-product-controller.js

const Attribute = require("../../models/Attribute");
const PhysicalBrand = require("../../models/PhysicalBrand");
const PhysicalCategory = require("../../models/PhysicalCategory");
const PhysicalProduct = require("../../models/PhysicalProduct");
const PhysicalSubCategory = require("../../models/PhysicalSubCategory");
const Shop = require("../../models/Shop");
const Review = require("../../models/Review");

/**
 * Helper: compute price range, genders and brandIds from product docs
 */
const computeFilterCollections = (products) => {
  const prices = [];
  const genders = new Set();
  const brandIds = new Set();

  for (const product of products) {
    if (product.gender) genders.add(product.gender);
    if (product.brand) brandIds.add(product.brand?.toString());

    if (product.type === "simple") {
      if (typeof product.price === "number") prices.push(product.price);
    } else if (product.type === "variable") {
      const variantPrices = (product.variants || [])
        .filter((v) => typeof v.price === "number")
        .map((v) => v.price);
      prices.push(...variantPrices);
    }
  }

  const min = prices.length ? Math.min(...prices) : 0;
  const max = prices.length ? Math.max(...prices) : 100000;

  return { prices: [min, max], genders: Array.from(genders), brandIds: Array.from(brandIds) };
};

/* Get Filters (Public) */
const getFilters = async (req, res) => {
  try {
    const products = await PhysicalProduct.find({ status: "published" }).select([
      "type",
      "price",
      "variants",
      "gender",
      "brand",
    ]);

    const { prices, genders, brandIds } = computeFilterCollections(products);

    const attributes = await Attribute.find({}).lean();
    const brands = await PhysicalBrand.find({
      status: { $ne: "inactive" },
      _id: { $in: brandIds },
    })
      .select("name slug")
      .lean();

    res.status(200).json({ success: true, data: { attributes, prices, genders, brands } });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/* Get Filters by Category (Public) */
const getFiltersByCategory = async (req, res) => {
  try {
    const { shop, category } = req.params;
    const shopData = await Shop.findOne({ slug: shop }).select("_id").lean();
    if (!shopData) return res.status(404).json({ success: false, message: "Shop Not Found" });

    const categoryData = await PhysicalCategory.findOne({ slug: category }).select("_id name").lean();
    if (!categoryData) return res.status(404).json({ success: false, message: "Category Not Found" });

    const products = await PhysicalProduct.find({
      status: "published",
      category: categoryData._id,
      shop: shopData._id,
    }).select(["type", "price", "variants", "gender", "brand"]);

    const { prices, genders, brandIds } = computeFilterCollections(products);
    const attributes = await Attribute.find({}).lean();
    const brands = await PhysicalBrand.find({
      status: { $ne: "inactive" },
      _id: { $in: brandIds },
    }).select("name slug");
    res.status(200).json({ success: true, data: { attributes, prices, genders, brands } });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/* Get Filters by SubCategory (Public) */
const getFiltersBySubCategory = async (req, res) => {
  try {
    const { shop, category, subcategory } = req.params;
    const shopData = await Shop.findOne({ slug: shop }).select("_id").lean();
    if (!shopData) return res.status(404).json({ success: false, message: "Shop Not Found" });

    const categoryData = await PhysicalCategory.findOne({ slug: category }).select("_id name").lean();
    if (!categoryData) return res.status(404).json({ success: false, message: "Category Not Found" });

    const subcategoryData = await PhysicalSubCategory.findOne({
      slug: subcategory,
      parentCategory: categoryData._id,
    }).select("_id").lean();
    if (!subcategoryData) return res.status(404).json({ success: false, message: "Subcategory Not Found" });

    const products = await PhysicalProduct.find({
      status: "published",
      subCategory: subcategoryData._id,
      shop: shopData._id,
    }).select(["type", "price", "variants", "gender", "brand"]);

    const { prices, genders, brandIds } = computeFilterCollections(products);
    const attributes = await Attribute.find({}).lean();
    const brands = await PhysicalBrand.find({
      status: { $ne: "inactive" },
      _id: { $in: brandIds },
    }).select("name slug");
    res.status(200).json({ success: true, data: { attributes, prices, genders, brands } });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/* Get Filters by Shop (Public) */
const getFiltersByShop = async (req, res) => {
  try {
    const { shop } = req.params;
    const shopData = await Shop.findOne({ slug: shop }).select("_id").lean();
    if (!shopData) return res.status(404).json({ success: false, message: "Shop Not Found" });

    const products = await PhysicalProduct.find({
      status: "published",
      shop: shopData._id,
    }).select(["type", "price", "variants", "gender", "brand"]);

    const { prices, genders, brandIds } = computeFilterCollections(products);
    const attributes = await Attribute.find({}).lean();
    const brands = await PhysicalBrand.find({
      status: { $ne: "inactive" },
      _id: { $in: brandIds },
    }).select("name slug");
    res.status(200).json({ success: true, data: { attributes, prices, genders, brands } });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/* Get All Product Slugs (Public) */
const getAllProductSlug = async (req, res) => {
  try {
    const products = await PhysicalProduct.find().select("slug").lean();
    res.status(200).json({ success: true, data: products });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/* Related Products (Public) */
const relatedProducts = async (req, res) => {
  try {
    const pid = req.params.pid;
    const product = await PhysicalProduct.findById(pid).select("_id category").lean();
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });

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
              initialValue: { stockQuantity: Number.MAX_VALUE, price: null, salePrice: null },
              in: {
                $cond: [
                  { $lt: ["$$this.stockQuantity", "$$value.stockQuantity"] },
                  { stockQuantity: "$$this.stockQuantity", price: "$$this.price", salePrice: "$$this.salePrice" },
                  "$$value",
                ],
              },
            },
          },
        },
      },
      {
        $addFields: {
          stockQuantity: { $cond: [{ $eq: ["$type", "variable"] }, "$variantWithLeastStock.stockQuantity", "$stockQuantity"] },
          price: { $cond: [{ $eq: ["$type", "variable"] }, "$variantWithLeastStock.price", "$price"] },
          salePrice: { $cond: [{ $eq: ["$type", "variable"] }, "$variantWithLeastStock.salePrice", "$salePrice"] },
        },
      },
      {
        $match: { category: product.category, _id: { $ne: product._id }, status: "published" },
      },
      { $limit: 8 },
      {
        $project: {
          images: 1, name: 1, slug: 1, type: 1, discount: 1, likes: 1,
          salePrice: 1, price: 1, averageRating: 1, stockQuantity: 1, vendor: 1, shop: 1, createdAt: 1,
        },
      },
    ]);

    res.status(200).json({ success: true, data: related });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/* Get One Product by Slug (Public) */
const getOneProductBySlug = async (req, res) => {
  try {
    const product = await PhysicalProduct.findOne({ slug: req.params.slug })
      .populate({ path: "shop", select: "brand slug name" })
      .populate({ path: "category", select: "name slug" })
      .populate({ path: "subCategory", select: "name slug" })
      .populate({ path: "brand", select: "name slug" })
      .lean();

    if (!product) return res.status(404).json({ success: false, message: "Product not found" });

    const agg = await PhysicalProduct.aggregate([
      { $match: { slug: req.params.slug } },
      { $lookup: { from: "reviews", localField: "reviews", foreignField: "_id", as: "reviews" } },
      { $project: { _id: 0, totalReviews: { $size: "$reviews" }, averageRating: { $avg: "$reviews.rating" } } },
    ]);
    const report = agg[0] || { totalReviews: 0, averageRating: 0 };

    res.status(200).json({ success: true, data: product, totalReviews: report.totalReviews, totalRating: report.averageRating || 0 });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/* Compare Products (Public) */
const getCompareProducts = async (req, res) => {
  try {
    const ids = req.body.products || [];
    if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ success: false, message: "Provide products array" });

    const fetched = await PhysicalProduct.find({ _id: { $in: ids }, status: "published" }).select("_id").lean();
    const productIds = fetched.map((p) => p._id);

    const shopColl = Shop.collection.name;
    const brandColl = PhysicalBrand.collection.name;
    const categoryColl = PhysicalCategory.collection.name;
    const subCategoryColl = PhysicalSubCategory.collection.name;
    const reviewsColl = "reviews";

    const products = await PhysicalProduct.aggregate([
      { $match: { _id: { $in: productIds }, status: "published" } },
      { $lookup: { from: reviewsColl, localField: "reviews", foreignField: "_id", as: "reviews" } },
      { $lookup: { from: shopColl, localField: "shop", foreignField: "_id", as: "shop" } }, { $unwind: { path: "$shop", preserveNullAndEmptyArrays: true } },
      { $lookup: { from: brandColl, localField: "brand", foreignField: "_id", as: "brand" } }, { $unwind: { path: "$brand", preserveNullAndEmptyArrays: true } },
      { $lookup: { from: categoryColl, localField: "category", foreignField: "_id", as: "category" } }, { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
      { $lookup: { from: subCategoryColl, localField: "subCategory", foreignField: "_id", as: "subCategory" } }, { $unwind: { path: "$subCategory", preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          averageRating: { $avg: "$reviews.rating" },
          variantWithLeastStock: {
            $reduce: {
              input: "$variants",
              initialValue: { stockQuantity: Number.MAX_VALUE, price: null, salePrice: null },
              in: {
                $cond: [
                  { $lt: ["$$this.stockQuantity", "$$value.stockQuantity"] },
                  { stockQuantity: "$$this.stockQuantity", price: "$$this.price", salePrice: "$$this.salePrice" },
                  "$$value",
                ],
              },
            },
          },
        },
      },
      {
        $addFields: {
          stockQuantity: { $cond: [{ $eq: ["$type", "variable"] }, "$variantWithLeastStock.stockQuantity", "$stockQuantity"] },
          price: { $cond: [{ $eq: ["$type", "variable"] }, "$variantWithLeastStock.price", "$price"] },
          salePrice: { $cond: [{ $eq: ["$type", "variable"] }, "$variantWithLeastStock.salePrice", "$salePrice"] },
          variants: {
            $map: {
              input: "$variants",
              as: "v",
              in: { _id: "$$v._id", name: "$$v.name", variant: "$$v.variant", price: "$$v.price", salePrice: "$$v.salePrice", stockQuantity: "$$v.stockQuantity" },
            },
          },
        },
      },
      {
        $project: {
          images: 1, name: 1, slug: 1, variants: 1, discount: 1, likes: 1, type: 1, salePrice: 1, price: 1, averageRating: 1,
          stockQuantity: 1, vendor: 1, createdAt: 1, "shop.name": 1, "brand.name": 1, "category.name": 1, "subCategory.name": 1,
        },
      },
    ]);

    res.status(200).json({ success: true, data: products });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/* Get Products (Public) - complex, supports variant filters & pagination */
const getPhysicalProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      name,
      top,
      date,
      price: sortPrice,
      category,
      subcategory,
      // childcategory removed on purpose
      brand,
      shop,
      isFeatured,
      prices, // price range "min_max"
      ...dynamicFilters
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const matchStage = { status: "published" };

    if (category) {
      const categoryDoc = await PhysicalCategory.findOne({ slug: category }).select("_id").lean();
      if (!categoryDoc) return res.status(200).json({ success: true, products: [], total: 0, count: 0 });
      matchStage.category = categoryDoc._id;
    }

    if (subcategory) {
      const subDoc = await PhysicalSubCategory.findOne({ slug: subcategory }).select("_id").lean();
      if (!subDoc) return res.status(200).json({ success: true, products: [], total: 0, count: 0 });
      matchStage.subCategory = subDoc._id;
    }

    if (brand) {
      const brandDoc = await PhysicalBrand.findOne({ slug: brand }).select("_id").lean();
      if (!brandDoc) return res.status(200).json({ success: true, products: [], total: 0, count: 0 });
      matchStage.brand = brandDoc._id;
    }

    if (shop) {
      const shopDoc = await Shop.findOne({ slug: shop }).select("_id").lean();
      if (!shopDoc) return res.status(200).json({ success: true, products: [], total: 0, count: 0 });
      matchStage.shop = shopDoc._id;
    }

    if (isFeatured !== undefined) matchStage.isFeatured = isFeatured === "true";

    // variant filter conditions
    const variantConditions = [];
    for (const key in dynamicFilters) {
      const values = String(dynamicFilters[key]).split("_").map((v) => v.trim()).filter(Boolean);
      variantConditions.push({ "variants.variant": { $regex: new RegExp(`(^|/)${key}(/|$)`, "i") } });
      if (values.length) variantConditions.push({ "variants.name": { $regex: new RegExp(`(${values.join("|")})`, "i") } });
    }

    // price range
    let priceRangeMatchSimple = [];
    let priceRangeMatchVariant = [];
    if (prices && prices.includes("_")) {
      const [min, max] = prices.split("_").map(Number);
      if (!isNaN(min) && !isNaN(max)) {
        priceRangeMatchSimple = [{ $match: { salePrice: { $gte: min, $lte: max } } }];
        priceRangeMatchVariant = [{ $match: { "variants.salePrice": { $gte: min, $lte: max } } }];
      }
    }

    // safe sort normalizer
    const normalizeDir = (v) => {
      if (v === undefined || v === null) return null;
      const s = String(v).toLowerCase();
      if (s === "asc" || s === "1") return 1;
      if (s === "desc" || s === "-1") return -1;
      return null;
    };

    const nameDir = normalizeDir(name);
    const topDir = normalizeDir(top);
    const dateDir = normalizeDir(date);
    const priceDir = normalizeDir(sortPrice);

    const sortObj = {};
    if (nameDir) sortObj.name = nameDir;
    if (topDir) sortObj.averageRating = topDir;
    if (dateDir) sortObj.createdAt = dateDir;
    if (priceDir) sortObj["variant.salePrice"] = priceDir;
    if (Object.keys(sortObj).length === 0) sortObj.createdAt = -1;

    // build pipeline
    const pipeline = [
      { $match: matchStage },
      {
        $facet: {
          simple: [
            ...(Object.keys(dynamicFilters).length > 0 ? [{ $match: { _id: null } }] : []),
            ...(Object.keys(dynamicFilters).length === 0
              ? [
                  { $match: { type: "simple" } },
                  ...priceRangeMatchSimple,
                  { $lookup: { from: "reviews", localField: "reviews", foreignField: "_id", as: "reviewDetails" } },
                  { $addFields: { averageRating: { $cond: [{ $gt: [{ $size: "$reviewDetails" }, 0] }, { $avg: "$reviewDetails.rating" }, 0] } } },
                  {
                    $project: {
                      _id: 1, name: 1, slug: 1, type: 1,
                      price: "$price", salePrice: "$salePrice", stockQuantity: "$stockQuantity", images: "$images", variant: null,
                      rating: "$averageRating",
                    },
                  },
                ]
              : []),
          ],
          variable: [
            { $match: { type: "variable" } },
            { $unwind: "$variants" },
            ...(variantConditions.length > 0 ? [{ $match: { $and: variantConditions } }] : []),
            ...(priceRangeMatchVariant.length > 0 ? priceRangeMatchVariant : []),
            { $lookup: { from: "reviews", localField: "reviews", foreignField: "_id", as: "reviewDetails" } },
            { $addFields: { averageRating: { $cond: [{ $gt: [{ $size: "$reviewDetails" }, 0] }, { $avg: "$reviewDetails.rating" }, 0] } } },
            { $project: { _id: 1, name: 1, slug: 1, type: 1, isFeatured: 1, images: 1, status: 1, averageRating: 1, variant: "$variants" } },
          ],
        },
      },
      { $project: { allProducts: { $concatArrays: ["$simple", "$variable"] } } },
      { $unwind: "$allProducts" },
      { $replaceRoot: { newRoot: "$allProducts" } },
      { $addFields: { averageRating: "$rating" } }, // ensure averageRating exists in root
      { $sort: sortObj },
      { $skip: skip },
      { $limit: parseInt(limit) },
    ];

    const products = await PhysicalProduct.aggregate(pipeline);

    // Count pipeline
    const countPipeline = [
      { $match: matchStage },
      {
        $facet: {
          simple: [
            ...(Object.keys(dynamicFilters).length > 0 ? [{ $match: { _id: null } }] : []),
            ...(Object.keys(dynamicFilters).length === 0 ? [{ $match: { type: "simple" } }, ...priceRangeMatchSimple] : []),
          ],
          variable: [
            { $match: { type: "variable" } },
            { $unwind: "$variants" },
            ...(variantConditions.length > 0 ? [{ $match: { $and: variantConditions } }] : []),
            ...(priceRangeMatchVariant.length > 0 ? priceRangeMatchVariant : []),
          ],
        },
      },
      { $project: { total: { $size: { $concatArrays: ["$simple", "$variable"] } } } },
      { $group: { _id: null, total: { $sum: "$total" } } },
    ];

    const countResult = await PhysicalProduct.aggregate(countPipeline);
    const total = countResult[0]?.total || 0;
    const pages = Math.ceil(total / parseInt(limit));

    const mappedProducts = products.map((p) => {
      if (p.type === "variable" && p.variant) {
        return {
          ...p,
          price: p.variant.price,
          salePrice: p.variant.salePrice,
          stockQuantity: p.variant.stockQuantity,
          variant: p.variant.name,
          images: p.variant.images || p.images,
        };
      }
      return p;
    });

    res.json({ success: true, data: mappedProducts, total, pages });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Something went wrong", error: error.message });
  }
};

module.exports = {
  getPhysicalProducts,
  getFilters,
  getFiltersByCategory,
  getFiltersBySubCategory,
  getFiltersByShop,
  getAllProductSlug,
  relatedProducts,
  getOneProductBySlug,
  getCompareProducts,
};
