const Cart = require('../../model/cartSchema');
const Product = require('../../model/productSchema');
const ProductVariant = require('../../model/variantSchema');
const MESSAGES = require('../../constants/messages');
const offerServices = require('../../services/admin/offerServices');

const calculateCartSubtotal = async (userId) => {
  const cart = await Cart.findOne({ userId });

  if (!cart || !cart.items || cart.items.length === 0) {
    throw new Error(MESSAGES.CART_EMPTY);
  }
  let subtotal = 0;
  let originalSubtotal = 0;
  let totalOfferDiscount = 0;

  const orderItems = [];
  for (const cartItem of cart.items) {
    const product = await Product.findOne({
      _id: cartItem.productId,
      isListed: true,
      isDeleted: false,
    });
    if (!product) {
      throw new Error(MESSAGES.PRODUCT_NO_LONGER);
    }
    let price = Number(product.basePrice);
    let variant = null;
    if (cartItem.variantId) {
      variant = await ProductVariant.findOne({
        _id: cartItem.variantId,
        productId: cartItem.productId,
        isActive: true,
      });
      if (!variant) {
        throw new Error(`${product.name} variant is no longer available`);
      }
      price = Number(variant.price);
    }
    const stock = variant ? variant.stock : product.stockLevel;
    if (stock <= 0 || cartItem.quantity > stock) {
      throw new Error(`Insufficient stock for ${product.name}`);
    }
    const pricing = await offerServices.getBestOfferForProduct(
      product._id,
      variant ? variant._id : null,
    );
    const discountAmount = Math.min(price, Math.max(0, Number(pricing?.discountAmount) || 0));

    const finalPrice = Math.max(0, price - discountAmount);
    const variantAttributes = variant
      ? variant.attributes.map((attribute) => ({
          name: attribute.name,
          value: attribute.value,
        }))
      : [];
    orderItems.push({
      productId: product._id,
      productName: product.name,
      productImage: product.primaryImage,
      variantId: variant ? variant._id : null,
      variantAttributes,
      price: finalPrice,
      originalPrice: price,
      discountAmount,
      discountPercentage: price > 0 ? Math.round((discountAmount / price) * 100) : 0,
      offerType: discountAmount > 0 ? pricing?.offerType || null : null,
      offerId: discountAmount > 0 ? pricing?.offerId || null : null,

      quantity: cartItem.quantity,
    });
    originalSubtotal += price * cartItem.quantity;
    subtotal += finalPrice * cartItem.quantity;
    totalOfferDiscount += discountAmount * cartItem.quantity;
  }
  return {
    orderItems,
    subtotal: Math.round(subtotal * 100) / 100,
    originalSubtotal: Math.round(originalSubtotal * 100) / 100,
    totalOfferDiscount: Math.round(totalOfferDiscount * 100) / 100,
  };
};

module.exports = {
  calculateCartSubtotal,
};
