const mongoose = require("mongoose");

const AttributeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  values: {
    type: [String],
    required: true,
  },
});

const Attribute = mongoose.model("Attribute", AttributeSchema);

module.exports = Attribute;
