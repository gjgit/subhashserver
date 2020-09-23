const { model, Schema } = require("mongoose");

const packSchema = new Schema({
  label: String,
  value: String,
});

module.exports = model("Packs", packSchema);
