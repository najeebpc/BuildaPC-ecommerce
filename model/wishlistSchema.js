const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    products: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
        },
        variantId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'ProductVariant',
          defualt: null,
        },
      },
    ],
  },
  {
    timeseries: true,
  },
);
module.exports = mongoose.model('Wishlist', wishlistSchema);
