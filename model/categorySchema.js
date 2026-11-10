const mongoose = require('mongoose');
const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  isListed: {
    type: Boolean,
    default: true,
  },
  variantAttributes: {
    type: [String],
    default: [],
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
});
module.exports = mongoose.model('Category', categorySchema);
