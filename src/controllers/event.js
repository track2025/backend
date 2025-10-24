const Events = require("../models/Event");
const getBlurDataURL = require("../config/getBlurDataURL");
const { singleFileDelete } = require("../config/uploader");

const getAllEvents = async (req, res) => {
  try {
    const events = await Events.find().sort({
      createdAt: -1,
    });
    res.status(201).json({
      success: true,
      data: events,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllEvents,
};
