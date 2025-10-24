const PhysicalBrand = require("../models/PhysicalBrand");
const PhysicalProduct = require("../models/PhysicalProduct");
const PhysicalCategory = require("../models/PhysicalCategory");
const { singleFileDelete } = require("../config/uploader");

/*----------------------------------
  Create a new physical product (Admin)
-----------------------------------*/
const createPhysicalProductByAdmin = async (req, res) => {
  try {
    const { images, ...others } = req.body;

    const newProduct = await PhysicalProduct.create({
      ...others,
      images: images?.length ? images.map((img) => ({ ...img })) : [],
    });

    console.log("Created new physical product:", newProduct);

    res.status(201).json({
      success: true,
      message: "Physical product created successfully.",
      data: newProduct,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/*----------------------------------
  Get all physical products (Admin)
  with pagination, search, filters
-----------------------------------*/
const getPhysicalProductsByAdmin = async (req, res) => {
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
          vendor: 1,
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

/*----------------------------------
  Get a single physical product by slug (Admin)
-----------------------------------*/
const getOnePhysicalProductByAdmin = async (req, res) => {
  try {
    const { slug } = req.params;

    const product = await PhysicalProduct.findOne({ slug })
      .populate("brand", "name slug")
      .populate("category", "name slug");

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Physical product not found.",
      });
    }

    res.status(200).json({
      success: true,
      data: product,
      message: "Physical product fetched successfully.",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/*----------------------------------
  Update a physical product by slug (Admin)
-----------------------------------*/
const updatePhysicalProductByAdmin = async (req, res) => {
  try {
    const { slug, currentSlug } = req.body;

    console.info("Updating product with:", { slug, currentSlug });

    // Use the currentSlug to find the original product
    const query = currentSlug ? { slug: currentSlug } : { slug };

    const updated = await PhysicalProduct.findOneAndUpdate(
      query,
      { ...req.body },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    console.info("Updated product:", updated);
    return res.status(200).json({
      success: true,
      data: updated,
      message: "Product Updated Successfully",
    });
  } catch (error) {
    console.error("Update error:", error);
    return res.status(400).json({ success: false, error: error.message });
  }
};


/*----------------------------------
  Delete a physical product by slug (Admin)
-----------------------------------*/
const deletePhysicalProductByAdmin = async (req, res) => {
  try {
    const { slug } = req.params;
    const product = await PhysicalProduct.findOne({ slug });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Physical product not found.",
      });
    }

    // Delete all uploaded image files
    if (product.images && product.images.length > 0) {
      for (const img of product.images) {
        if (img?._id) {
          await singleFileDelete(req, img._id);
        }
      }
    }

    await PhysicalProduct.deleteOne({ _id: product._id });

    res.status(200).json({
      success: true,
      message: "Physical product and associated files deleted successfully.",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createPhysicalProductByAdmin,
  getPhysicalProductsByAdmin,
  getOnePhysicalProductByAdmin,
  updatePhysicalProductByAdmin,
  deletePhysicalProductByAdmin,
};
