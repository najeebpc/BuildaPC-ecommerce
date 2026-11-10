const Cart = require('../../model/cartSchema');
const Product = require('../../model/productSchema');
const ProductVariant = require('../../model/variantSchema');
const offerServices = require('../../services/admin/offerServices');

const MESSAGES = require('../../constants/messages');

const Max_Cart_Quantity = 5;
const addToCart = async (userId, productId, variantId = null, quantity = 1) => {
  const product = await Product.findOne({
    _id: productId,
    isListed: true,
    isDeleted: false,
  });
  if (!product) {
    throw new Error(MESSAGES.PRODUCT_NOT_AVAILABLE);
  }
  let stock = product.stockLevel;
  if (variantId) {
    const variant = await ProductVariant.findOne({
      _id: variantId,
      productId: productId,
      isActive: true,
    });
    if (!variant) {
      throw new Error(MESSAGES.PRODUCT_VARIANT_NOT_AVAILABLE);
    }
    stock = variant.stock;
  }
  if (stock <= 0) {
    throw new Error(MESSAGES.PRODCUT_OUT_OF_STOCK);
  }
  if (quantity > Max_Cart_Quantity) {
    throw new Error(`Maximum ${Max_Cart_Quantity} quantity allowed`);
  }
  let cart = await Cart.findOne({ userId });
  if (!cart) {
    cart = await Cart.create({
      userId,
      items: [
        {
          productId,
          variantId,
          quantity,
        },
      ],
    });
    return cart;
  }
  const existingItem = cart.items.find((item) => {
    const sameProduct = item.productId.toString() === productId.toString();
    const sameVariant = String(item.variantId) === String(variantId);
    return sameProduct && sameVariant;
  });
  if (existingItem) {
    throw new Error(MESSAGES.PRODUCT_IN_CART);
  }
  cart.items.push({
    productId,
    variantId,
    quantity,
  });
  await cart.save();
  return cart;
};

const getCart = async (userId) => {
  const cart = await Cart.findOne({ userId })
    .populate(
      'items.productId',
      'name basePrice primaryImage stockLevel isListed isDeleted categoryId',
    )
    .populate('items.variantId', 'attributes price stock isActive')
    .lean();

  if (!cart || !cart.items || cart.items.length === 0) {
    return [];
  }

  const itemsWithPricing = await Promise.all(
    cart.items.map(async (item) => {
      const product = item.productId;
      const variant = item.variantId;
      if (!product) {
        return {
          ...item,
          originalPrice: 0,
          discountAmount: 0,
          finalPrice: 0,
          discountPercentage: 0,
          lineTotal: 0,
          pricingUnavailable: true,
        };
      }
      const originalPrice = Number(variant ? variant.price : product.basePrice);
      let pricing = null;
      try {
        pricing = await offerServices.getBestOfferForProduct(product._id, variant?._id || null);
      } catch (error) {
        console.error('Failed to calculate cart offer:', product._id, error.message);
      }
      const discountAmount = Math.min(
        originalPrice,
        Math.max(0, Number(pricing?.discountAmount) || 0),
      );
      const finalPrice = Math.max(0, originalPrice - discountAmount);
      const discountPercentage =
        originalPrice > 0 ? Math.round((discountAmount / originalPrice) * 100) : 0;
      return {
        ...item,
        originalPrice,
        discountAmount,
        finalPrice,
        discountPercentage,
        offerType: discountAmount > 0 ? pricing?.offerType || null : null,
        lineTotal: finalPrice * Number(item.quantity),
        pricingUnavailable: false,
      };
    }),
  );
  return itemsWithPricing;
};

const removeFromCart = async (userId, cartItemId) => {
  const cart = await Cart.findOne({ userId });
  if (!cart) {
    throw new Error(MESSAGES.CART_NOT_FOUND);
  }
  const itemExists = cart.items.some((item) => item._id.toString() === cartItemId.toString());
  if (!itemExists) {
    throw new Error(MESSAGES.CART_ITEM_NOT_FOUND);
  }
  cart.items = cart.items.filter((item) => item._id.toString() !== cartItemId.toString());
  await cart.save();
  return cart;
};
const updateCartQuantity = async (userId, cartItemId, quantity) => {
  const cart = await Cart.findOne({ userId });
  if (!cart) {
    throw new Error(MESSAGE.CART_NOT_FOUND);
  }
  const cartItem = cart.items.id(cartItemId);
  if (!cartItem) {
    throw new Error(MESSAGES.CART_ITEM_NOT_FOUND);
  }
  if (quantity > Max_Cart_Quantity) {
    throw new Error(`Maximum ${Max_Cart_Quantity} quantity allowed`);
  }
  let stock;
  if (cartItem.variantId) {
    const variant = await ProductVariant.findOne({
      _id: cartItem.variantId,
      productId: cartItem.productId,
      isActive: true,
    });
    if (!variant) {
      throw new Error(MESSAGES.PRODUCT_VARIANT_NOT_AVAILABLE);
    }
    stock = variant.stock;
  } else {
    const product = await Product.findOne({
      _id: cartItem.productId,
      isListed: true,
      isDeleted: false,
    });
    if (!product) {
      throw new Error(MESSAGES.PRODUCT_NOT_AVAILABLE);
    }
    stock = product.stockLevel;
  }
  if (stock <= 0) {
    throw new Error(MESSAGES.PRODCUT_OUT_OF_STOCK);
  }
  if (quantity > stock && quantity >= cartItem.quantity) {
    throw new Error(`Only ${stock} item${stock > 1 ? 's' : ''} available`);
  }
  cartItem.quantity = quantity;
  await cart.save();
};
const validateCartForCheckout = async (userId) => {
  const cart = await Cart.findOne({ userId });
  if (!cart || !cart.items || cart.items.length === 0) {
    throw new Error(MESSAGES.CART_EMPTY);
  }
  for (const item of cart.items) {
    const product = await Product.findOne({
      _id: item.productId,
      isListed: true,
      isDeleted: false,
    });
    if (!product) {
      throw new Error(MESSAGES.PRODUCT_NO_LONGER);
    }
    let stock = product.stockLevel;
    if (item.variantId) {
      const variant = await ProductVariant.findOne({
        _id: item.variantId,
        productId: item.productId,
        isActive: true,
      });
      if (!variant) {
        throw new Error(MESSAGE.PRODUCT_VARIANT_NOT_AVAILABLE);
      }
      stock = variant.stock;
    }
    if (stock <= 0) {
      throw new Error(`${product.name} is out of stock`);
    }
    if (item.quantity > stock) {
      throw new Error(`Only ${stock} item${stock > 1 ? 's' : ''} of ${product.name} available`);
    }
  }
  return true;
};
module.exports = {
  addToCart,
  getCart,
  removeFromCart,
  updateCartQuantity,
  validateCartForCheckout,
};
