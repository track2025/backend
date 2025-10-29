const Attribute = require("../models/Attribute");

/*  Create a new attribute (admin only) */
const createAttributeByAdmin = async (req, res) => {
  try {
    const { name, values } = req.body;
    const newAttribute = await Attribute.create({
      name,
      values,
    });

    res.status(201).json({
      success: true,
      data: newAttribute,
      message: "Attribute Created",
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/*  Get all attributes created by admin */
const getAllAttributesByAdmin = async (req, res) => {
  try {
    const attributes = await Attribute.find().sort({
      createdAt: -1,
    });
    res.status(200).json({
      success: true,
      data: attributes,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/*  Get attribute details by ID (admin only) */
const getAttributeByIdByAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const attribute = await Attribute.findOne({ _id: id });

    if (!attribute) {
      return res
        .status(404)
        .json({ success: false, message: "Attribute Not Found" });
    }

    res.status(200).json({
      success: true,
      data: attribute,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/*  Update attribute by ID (admin only) */
const updateAttributeByIdByAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, values } = req.body;
    const updatedAttribute = await Attribute.findOneAndUpdate(
      { _id: id },
      {
        name,
        values,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedAttribute) {
      return res
        .status(404)
        .json({ success: false, message: "Attribute Not Found" });
    }

    res.status(200).json({
      success: true,
      data: updatedAttribute,
      message: "Attribute Updated",
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/*  Delete attribute by ID (admin only) */
const deleteAttributeByIdByAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const attribute = await Attribute.findOne({ _id: id });

    if (!attribute) {
      return res
        .status(404)
        .json({ success: false, message: "Attribute Not Found" });
    }

    await Attribute.deleteOne({ _id: id });

    res.status(204).json({ success: true, message: "Attribute Deleted" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/*  Get all attributes created by admin */
const getAttributesByAdmin = async (req, res) => {
  try {
    const { limit = 10, page = 1, search = "" } = req.query;

    const skip = parseInt(limit) || 10;
    const totalAttributes = await Attribute.find({
      name: { $regex: search, $options: "i" },
    });
    const attributes = await Attribute.find(
      {
        name: { $regex: search, $options: "i" },
      },
      null,
      {
        skip: skip * (parseInt(page) - 1 || 0),
        limit: skip,
      }
    ).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      data: attributes,
      count: Math.ceil(totalAttributes.length / skip),
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  createAttributeByAdmin,
  getAttributeByIdByAdmin,
  updateAttributeByIdByAdmin,
  deleteAttributeByIdByAdmin,
  getAttributesByAdmin,
  getAllAttributesByAdmin,
};
