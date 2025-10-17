const PhysicalBrand = require("../models/PhysicalBrand");
const PhysicalProduct = require("../models/PhysicalProduct");
const Shop = require("../models/Shop");
const PhysicalCategory = require("../models/PhysicalCategory");
const PhysicalSubCategory = require("../models/PhysicalSubCategory");
const PhysicalChildCategory = require("../models/PhysicalChildCategory");

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

    let prices = [];
    let genders = new Set();
    let brandIds = new Set();

    for (const product of products) {
      if (product.gender) genders.add(product.gender);
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

    const min = prices.length ? Math.min(...prices) : 0;
    const max = prices.length ? Math.max(...prices) : 100000;

    const attributes = await Attribute.find({});
    const brands = await PhysicalBrand.find({
      status: { $ne: "inactive" },
      _id: { $in: Array.from(brandIds) },
    }).select("name slug");

    res.status(200).json({
      success: true,
      data: { attributes, prices: [min, max], genders: Array.from(genders), brands },
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/* Get Filters by Category (Public) */
const getFiltersByCategory = async (req, res) => {
  try {
    const { shop, category } = req.params;

    const shopData = await Shop.findOne({ slug: shop }).select("_id");
    if (!shopData) return res.status(404).json({ success: false, message: "Shop Not Found" });

    const categoryData = await PhysicalCategory.findOne({ slug: category }).select("_id name");
    if (!categoryData) return res.status(404).json({ success: false, message: "Category Not Found" });

    const products = await PhysicalProduct.find({
      status: "published",
      category: categoryData._id,
      shop: shopData._id,
    }).select(["type", "price", "variants", "gender", "brand"]);

    let prices = [];
    let genders = new Set();
    let brandIds = new Set();

    for (const product of products) {
      if (product.gender) genders.add(product.gender);
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

    const min = prices.length ? Math.min(...prices) : 0;
    const max = prices.length ? Math.max(...prices) : 100000;

    const attributes = await Attribute.find({});
    const brands = await PhysicalBrand.find({
      status: { $ne: "inactive" },
      _id: { $in: Array.from(brandIds) },
    }).select("name slug");

    res.status(200).json({
      success: true,
      data: { attributes, prices: [min, max], genders: Array.from(genders), brands },
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/* Get Filters by SubCategory (Public) */
const getFiltersBySubCategory = async (req, res) => {
  try {
    const { shop, category, subcategory } = req.params;

    const shopData = await Shop.findOne({ slug: shop }).select("_id");
    if (!shopData) return res.status(404).json({ success: false, message: "Shop Not Found" });

    const categoryData = await PhysicalCategory.findOne({ slug: category }).select("_id name");
    if (!categoryData) return res.status(404).json({ success: false, message: "Category Not Found" });

    const subcategoryData = await PhysicalSubCategory.findOne({
      slug: subcategory,
      parentCategory: categoryData._id,
    }).select("_id");
    if (!subcategoryData) return res.status(404).json({ success: false, message: "Subcategory Not Found" });

    const products = await PhysicalProduct.find({
      status: "published",
      subCategory: subcategoryData._id,
      shop: shopData._id,
    }).select(["type", "price", "variants", "gender", "brand"]);

    let prices = [];
    let genders = new Set();
    let brandIds = new Set();

    for (const product of products) {
      if (product.gender) genders.add(product.gender);
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

    const min = prices.length ? Math.min(...prices) : 0;
    const max = prices.length ? Math.max(...prices) : 100000;

    const attributes = await Attribute.find({});
    const brands = await PhysicalBrand.find({
      status: { $ne: "inactive" },
      _id: { $in: Array.from(brandIds) },
    }).select("name slug");

    res.status(200).json({
      success: true,
      data: { attributes, prices: [min, max], genders: Array.from(genders), brands },
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/* Get Filters by Shop (Public) */
const getFiltersByShop = async (req, res) => {
  try {
    const { shop } = req.params;

    const shopData = await Shop.findOne({ slug: shop }).select("name slug");
    if (!shopData) return res.status(404).json({ success: false, message: "Shop Not Found" });

    const products = await PhysicalProduct.find({
      status: "published",
      shop: shopData._id,
    }).select(["type", "price", "variants", "gender", "brand"]);

    let prices = [];
    let genders = new Set();
    let brandIds = new Set();

    for (const product of products) {
      if (product.gender) genders.add(product.gender);
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

    const min = prices.length ? Math.min(...prices) : 0;
    const max = prices.length ? Math.max(...prices) : 100000;

    const attributes = await Attribute.find({});
    const brands = await PhysicalBrand.find({
      status: { $ne: "inactive" },
      _id: { $in: Array.from(brandIds) },
    }).select("name slug");

    res.status(200).json({
      success: true,
      data: { attributes, prices: [min, max], genders: Array.from(genders), brands },
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/* Get All Product Slugs (Public) */
const getAllProductSlug = async (req, res) => {
  try {
    const products = await PhysicalProduct.find().select("slug");
    res.status(200).json({ success: true, data: products });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/* Related Products (Public) */
const relatedProducts = async (req, res) => {
  try {
    const pid = req.params.pid;
    const product = await PhysicalProduct.findById(pid).select("_id category");

    const related = await PhysicalProduct.aggregate([
      { $match: { category: product.category, _id: { $ne: product._id }, status: "published" } },
      { $limit: 8 },
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
      .populate({ path: "shop", select: "brand slug" })
      .populate({ path: "category", select: "name slug" })
      .populate({ path: "subCategory", select: "name slug" })
      .populate({ path: "childCategory", select: "name slug" })
      .populate({ path: "brand", select: "name slug" });

    res.status(200).json({ success: true, data: product });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/* Get Products (Public) */
const getProducts = async (req, res) => {
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
      childcategory,
      brand,
      shop,
      isFeatured,
      prices, // Price range filter
      ...dynamicFilters // like color=red_green&size=xl_md
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const matchStage = { status: "published" };

    // Category filtering
    if (category) {
      const categoryDoc = await PhysicalCategory.findOne({ slug: category });
      if (!categoryDoc)
        return res.status(200).json({ success: true, products: [], total: 0, count: 0 });
      matchStage.category = categoryDoc._id;
    }

    if (subcategory) {
      const subDoc = await PhysicalSubCategory.findOne({ slug: subcategory });
      if (!subDoc)
        return res.status(200).json({ success: true, products: [], total: 0, count: 0 });
      matchStage.subCategory = subDoc._id;
    }

    if (childcategory) {
      const childDoc = await PhysicalChildCategory.findOne({ slug: childcategory });
      if (!childDoc)
        return res.status(200).json({ success: true, products: [], total: 0, count: 0 });
      matchStage.childCategory = childDoc._id;
    }

    if (brand) {
      const brandDoc = await PhysicalBrand.findOne({ slug: brand });
      if (!brandDoc)
        return res.status(200).json({ success: true, products: [], total: 0, count: 0 });
      matchStage.brand = brandDoc._id;
    }

    if (shop) {
      const shopDoc = await Shop.findOne({ slug: shop });
      if (!shopDoc)
        return res.status(200).json({ success: true, products: [], total: 0, count: 0 });
      matchStage.shop = shopDoc._id;
    }

    if (isFeatured !== undefined) {
      matchStage.isFeatured = isFeatured === "true";
    }

    // Dynamic variant filters
    const variantConditions = [];
    for (const key in dynamicFilters) {
      const values = dynamicFilters[key].split("_");
      variantConditions.push({
        "variants.variant": { $regex: new RegExp(`(^|/)${key}(/|$)`, "i") },
      });
      variantConditions.push({
        "variants.name": { $regex: new RegExp(`(${values.join("|")})`, "i") },
      });
    }

    // Price range filter
    let priceRangeMatch = [];
    if (prices && prices.includes("_")) {
      const [min, max] = prices.split("_").map(Number);
      if (!isNaN(min) && !isNaN(max)) {
        priceRangeMatch = [
          {
            $match: {
              salePrice: { $gte: min, $lte: max },
            },
          },
        ];
      }
    }

    const pipeline = [
      { $match: matchStage },

      {
        $facet: {
          simple: [
            ...(Object.keys(dynamicFilters).length > 0 ? [{ $match: { _id: null } }] : []),
            ...(Object.keys(dynamicFilters).length === 0
              ? [
                { $match: { type: "simple" } },
                ...priceRangeMatch,
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
                    price: 1,
                    salePrice: 1,
                    stockQuantity: 1,
                    images: 1,
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
            ...(priceRangeMatch.length > 0
              ? [
                {
                  $match: {
                    "variants.salePrice": {
                      $gte: priceRangeMatch[0].$match.salePrice.$gte,
                      $lte: priceRangeMatch[0].$match.salePrice.$lte,
                    },
                  },
                },
              ]
              : []),
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
                variant: "$variants",
                averageRating: 1,
              },
            },
          ],
        },
      },

      { $project: { allProducts: { $concatArrays: ["$simple", "$variable"] } } },
      { $unwind: "$allProducts" },
      { $replaceRoot: { newRoot: "$allProducts" } },

      {
        $sort: (() => {
          const sort = {};
          if (name) sort.name = parseInt(name);
          if (top) sort.averageRating = parseInt(top);
          if (date) sort.createdAt = parseInt(date);
          if (sortPrice) sort["variant.salePrice"] = parseInt(sortPrice);
          return Object.keys(sort).length ? sort : { createdAt: -1 };
        })(),
      },

      { $skip: skip },
      { $limit: parseInt(limit) },
    ];

    const products = await PhysicalProduct.aggregate(pipeline);

    // Total count for pagination
    const countPipeline = [...pipeline, { $count: "total" }];
    const countResult = await PhysicalProduct.aggregate(countPipeline);
    const total = countResult[0]?.total || 0;
    const pages = Math.ceil(total / parseInt(limit));

    // Map variable products
    const mappedProducts = products.map((product) => {
      if (product.type === "variable") {
        return {
          ...product,
          price: product.variant.price,
          salePrice: product.variant.salePrice,
          stockQuantity: product.variant.stockQuantity,
          variant: product.variant.name,
          images: product.variant.images,
        };
      }
      return product;
    });

    res.json({
      success: true,
      data: mappedProducts,
      total,
      pages,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Something went wrong", error: error.message });
  }
};

// Admin: Create product
const createProductByAdmin = async (req, res) => {
  try {
    const product = await PhysicalProduct.create(req.body);
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Admin: Get products
const getProductsByAdmin = async (req, res) => {
  try {
    const products = await PhysicalProduct.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: products });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Admin: Get one product by slug
const getProductBySlugByAdmin = async (req, res) => {
  try {
    const product = await PhysicalProduct.findOne({ slug: req.params.slug });
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    res.status(200).json({ success: true, data: product });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Admin: Update product by slug
const updateProductBySlugByAdmin = async (req, res) => {
  try {
    const product = await PhysicalProduct.findOneAndUpdate({ slug: req.params.slug }, req.body, {
      new: true,
      runValidators: true,
    });
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    res.status(200).json({ success: true, data: product });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Admin: Delete product by slug
const deleteProductBySlugByAdmin = async (req, res) => {
  try {
    const product = await PhysicalProduct.findOneAndDelete({ slug: req.params.slug });
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    res.status(200).json({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};



module.exports = {
  getProducts,
  getFilters,
  getFiltersByCategory,
  getFiltersByShop,
  getAllProductSlug,
  getFiltersBySubCategory,
  relatedProducts,
  getOneProductBySlug,
  createProductByAdmin,
  getProductsByAdmin,
  getProductBySlugByAdmin,
  updateProductBySlugByAdmin,
  deleteProductBySlugByAdmin,
};

