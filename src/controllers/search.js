const Products = require('../models/Product');
const Shop = require('../models/Shop');
const Category = require('../models/Category');
const Brand = require('../models/Brand');
const SubCategory = require('../models/SubCategory');

const Search = async (req, res) => {
  try {
    const { query, subCategory, category, dateCaptured } = req.body;


    const matchConditions = {
      status: { $ne: 'disabled' },
    };

    // Fuzzy text match on name, location, vehicle_make, vehicle_model
    if (query) {
      const regexQuery = { $regex: query, $options: 'i' };

      matchConditions.$or = [
        { name: regexQuery },
        { location: regexQuery },
        { vehicle_make: regexQuery },
        { vehicle_model: regexQuery },
      ];
    }

    const { ObjectId } = require('mongoose').Types;

    // Match exact category or subcategory by vehicle_model
    if (category) {
      matchConditions.category = new ObjectId(category);
    }

    if (subCategory) {
      matchConditions.subCategory = new ObjectId(subCategory);
    }

    // Date filtering
    if (dateCaptured) {
      const startDate = new Date(dateCaptured);
      const endDate = new Date(dateCaptured);
      endDate.setUTCHours(23, 59, 59, 999);

      matchConditions.dateCaptured = {
        $gte: startDate,
        $lte: endDate,
      };
    }

    const products = await Products.aggregate([
      {
        $match: matchConditions,
      },
      {
        $addFields: {
          image: { $arrayElemAt: ['$images', 0] },
        },
      },
      {
        $project: {
          image: { url: '$image.url', blurDataURL: '$image.blurDataURL' },
          name: 1,
          priceSale: 1,
          slug: 1,
          _id: 1,
          vehicle_model: 1,
          vehicle_make: 1,
          location: 1,
        },
      },
      {
        $limit: 100,
      },
    ]);

    return res.status(200).json({
      success: true,
      products,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const getFilters = async (req, res) => {
  try {
    await SubCategory.findOne();
    const categories = await Category.find()
      .select(['_id', 'name', 'slug', 'subCategories'])
      .populate({
        path: 'subCategories',
        select: ['_id', 'name', 'slug'],
      });

    const shops = await Shop.find().select(['_id', 'title', 'slug']);

    return res.status(200).json({
      success: true,
      categories,
      shops,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = { Search, getFilters };
