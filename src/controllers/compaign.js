const Compaign = require('../models/Compaign');
const _ = require('lodash');
const getBlurDataURL = require('../config/getBlurDataURL');
const { getVendor, getAdmin, getUser } = require('../config/getUser');
const { singleFileDelete } = require('../config/uploader');
// Admin apis
const getAdminCompaigns = async (req, res) => {
  try {
    const { limit = 10, page = 1 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const totalCompaigns = await Compaign.countDocuments();

    const compaigns = await Compaign.find({}, null, {
      skip: skip,
      limit: parseInt(limit),
    })
      .select([
        'slug',
        'status',
        'products',
        'title',
        'startDate',
        'endDate',
        'discount',
        'discountType',
      ])

      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      data: compaigns,
      count: Math.ceil(totalCompaigns / limit),
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const createCompaign = async (req, res) => {
  try {
    const admin = await getAdmin(req, res);
    const { cover, ...others } = req.body;

    const coverBlurDataURL = await getBlurDataURL(cover.url);

    await Compaign.create({
      ...others,

      cover: {
        ...cover,
        blurDataURL: coverBlurDataURL,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Compaign created',
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};
const getOneCompaignByAdmin = async (req, res) => {
  try {
    // const admin = await getAdmin(req, res);
    const { slug } = req.params;
    const compaign = await Compaign.findOne({ slug: slug });
    if (!compaign) {
      return res.status(404).json({ message: 'Compaign Not Found' });
    }

    return res.status(200).json({
      success: true,
      data: compaign,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};
const updateOneCompaignByAdmin = async (req, res) => {
  try {
    const { slug } = req.params;
    const admin = await getAdmin(req, res);

    const { cover, ...others } = req.body;

    const coverBlurDataURL = await getBlurDataURL(cover.url);

    await Compaign.findOneAndUpdate(
      { slug: slug },
      {
        ...others,

        cover: { ...cover, blurDataURL: coverBlurDataURL },
      },
      { new: true, runValidators: true }
    );

    return res.status(200).json({ success: true, message: 'Updated Compaign' });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};
const deleteOneCompaignByAdmin = async (req, res) => {
  try {
    const admin = await getAdmin(req, res);
    const { slug } = req.params;
    const compaign = await Compaign.findOne({ slug });
    if (!compaign) {
      return res.status(404).json({ message: 'Compaign Not Found' });
    }
    await singleFileDelete(compaign.cover._id);

    await Compaign.deleteOne({ _id: sid }); // Corrected to pass an object to deleteOne method
    return res.status(200).json({
      success: true,
      message: 'Compaign Deleted Successfully', // Corrected message typo
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};
const getCompaignsByUser = async (req, res) => {
  try {
    const { limit } = req.query; // Destructure limit from query parameters

    let query = {}; // Initialize an empty query object

    if (limit) {
      // If limit is provided, convert it to a number and add to query
      const limitNumber = parseInt(limit);
      if (isNaN(limitNumber)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid limit parameter (must be a number).',
        });
      }
      query = { limit: limitNumber };
    }

    const campaigns = await Compaign.find(query); // Find campaigns with optional limit

    return res.status(200).json({
      success: true,
      data: campaigns,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};
module.exports = {
  getAdminCompaigns,
  createCompaign,
  getOneCompaignByAdmin,
  updateOneCompaignByAdmin,
  deleteOneCompaignByAdmin,
  getCompaignsByUser,
};
