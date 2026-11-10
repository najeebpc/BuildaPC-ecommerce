const Wishlist = require('../../model/wishlistSchema');
const Product = require('../../model/productSchema');
const Cart = require('../../model/cartSchema');

const MESSAGES = require('../../constants/messages');

const addToWishlist = async (userId, productId, variantId, fromCart = false) => {
  const product = await Product.findOne({
    _id: productId,
    isListed: true,
    isDeleted: false,
  });
  if (!product) {
    throw new Error(MESSAGES.PRODUCT_NOT_AVAILABLE);
  }
  if (!fromCart) {
    const cart = await Cart.findOne({ userId });
    if (cart) {
      const alreadyInCart = cart.items.some(
        (item) =>
          item.productId.toString() === productId.toString() &&
          String(item.variantId || '') === String(variantId || ''),
      );
      if (alreadyInCart) {
        throw new Error(MESSAGES.PRODUCT_IN_CART);
      }
    }
  }
  let wishlist = await Wishlist.findOne({ userId });
  if (!wishlist) {
    wishlist = await Wishlist.create({
      userId,
      products: [
        {
          productId,
          variantId,
        },
      ],
    });
    return wishlist;
  }
  const alreadyExists = wishlist.products.some(
    (item) =>
      item.productId.toString() === productId.toString() &&
      String(item.variantId || '') === String(variantId || ''),
  );
  if (alreadyExists) {
    throw new Error(MESSAGES.PRODUCT_IN_WISHLIST);
  }
  wishlist.products.push({
    productId,
    variantId,
  });
  await wishlist.save();
  return wishlist;
};
const getWishlist = async (userId) => {
  const wishlist = await Wishlist.findOne({
    userId,
  })
    .populate('products.productId', 'name basePrice primaryImage stockLevel isListed isDeleted')
    .populate('products.variantId', 'attributes price stock isActive')
    .lean();
  if (!wishlist) {
    return [];
  }
  return wishlist.products;
};
const removeFromWishlist = async (userId, productId, variantId) => {
  const wishlist = await Wishlist.findOne({ userId });
  if (!wishlist) {
    throw new Error(MESSAGES.WISHLIST_NOT_FOUND);
  }
  wishlist.products = wishlist.products.filter((item) => {
    const sameProduct = item.productId.toString() === productId.toString();
    const sameVariant = String(item.variantId || '') === String(variantId || '');
    return !(sameProduct && sameVariant);
  });

  await wishlist.save();
};
const removeProductIfExists = async (userId, productId) => {
  const wishlist = await Wishlist.findOne({ userId });
  if (!wishlist) {
    return;
  }
  const length = wishlist.products.length;
  wishlist.products = wishlist.products.filter(
    (item) => item.productId.toString() !== productId.toString(),
  );
  const removed = wishlist.products.length < length;
  if (removed) {
    await wishlist.save();
  }
  return { removed };
};
module.exports = {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  removeProductIfExists,
};
