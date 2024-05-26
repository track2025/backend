const Products = require('../models/Product');

const Search = async (req, res) => {
  try {
    const { query, brand, subCategory, category } = await req.body;

    const products = await Products.aggregate([
      {
        $match: {
          status: { $ne: 'disabled' },
          $or: [
            { name: { $regex: `^${query}`, $options: 'i' } }, // Match at beginning
            { name: { $regex: `${query}`, $options: 'i' } }, // Match anywhere
          ],
          ...(brand && {
            brand,
          }),
          ...(category && {
            category,
          }),
          ...(subCategory && {
            subCategory,
          }),
          status: { $ne: 'disabled' },
        },
      },
      {
        $lookup: {
          from: 'categories', // Assuming 'categories' is the name of your Category model collection
          localField: 'category', // Field in the Products model
          foreignField: '_id', // Field in the Category model
          as: 'categoryData',
        },
      },
      {
        $addFields: {
          category: { $arrayElemAt: ['$categoryData.name', 0] }, // Extracting the title from the categoryData array

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
          category: 1, // Including the category field with only the title
        },
      },

      {
        $limit: 10,
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

module.exports = { Search };
