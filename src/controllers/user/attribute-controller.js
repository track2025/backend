const Attribute = require("../../models/Attribute");

/*  Get all public attributes */
const getAttributes = async (req, res) => {
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

/*  Get attribute details by ID */
const getAttributeById = async (req, res) => {
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

module.exports = {
  getAttributes,
  getAttributeById,
};
