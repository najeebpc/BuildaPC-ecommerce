const mongoose = require('mongoose');
const Offer = require('../../model/offerSchema');
const Product = require('../../model/productSchema');
const Category = require('../../model/categorySchema');
const ProductVariant = require('../../model/variantSchema');
const MESSAGES = require('../../constants/messages');

const validateOfferData = async (offerData) => {
  const { offerType, productId, categoryId, discountPercentage, startDate, endDate } = offerData;
  const percentage = Number(discountPercentage);
  if (!Number.isFinite(percentage) || percentage <= 0 || percentage > 100) {
    throw new Error(MESSAGES.INVALID_DISCOUNT_PERCENTAGE);
  }
  if (!startDate || !endDate) {
    throw new Error(MESSAGES.OFFER_START_END_REQUIRED);
  }
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    throw new Error(MESSAGES.INVALID_OFFER_DATE_RANGE);
  }
  let validatedProductId = null;
  let validatedCategory = null;
  if (offerType === 'product') {
    if (!productId || !mongoose.isValidObjectId(productId) || categoryId) {
      throw new Error(MESSAGES.PRODUCT_REQUIRED_FOR_OFFER);
    }
    const product = await Product.findOne({
      _id: productId,
      isListed: true,
      isDeleted: false,
    });
    if (!product) {
      throw new Error(MESSAGES.PRODUCT_NOT_AVAILABLE);
    }
    validatedProductId = product._id;
  } else {
    if (!categoryId || !mongoose.isValidObjectId(categoryId) || productId) {
      throw new Error(MESSAGES.CATEGORY_REQUIRED_FOR_OFFER);
    }
    const category = await Category.findOne({
      _id: categoryId,
      isListed: true,
      isDeleted: false,
    });
    if (!category) {
      throw new Error(MESSAGES.CATEGORY_NOT_FOUND);
    }
    validatedCategory = category._id;
  }
  return {
    offerType,
    productId: validatedProductId,
    categoryId: validatedCategory,
    discountPercentage: percentage,
    startDate: start,
    endDate: end,
  };
};
async function hasExistingOffer(offerData, excludeOfferId = null) {
  const now = new Date();
  const query = {
    isActive: true,
    startDate: { $lte: now },
    endDate: { $gte: now },
    offerType: offerData.offerType,
    ...(offerData.offerType === 'product'
      ? { productId: offerData.productId }
      : { categoryId: offerData.categoryId }),
  };
  if (excludeOfferId) {
    query._id = { $ne: excludeOfferId };
  }
  return Offer.exists(query);
}
const createOffer = async (offerData) => {
  const validatedData = await validateOfferData(offerData);
  const existingOffer = await hasExistingOffer(validatedData);
  if (existingOffer) {
    throw new Error(
      offerData.offerType === 'product' ? MESSAGES.PRODUCT_HAS_OFFER : MESSAGES.CATEGORY_HAS_OFFER,
    );
  }
  return await Offer.create({
    ...validatedData,
    isActive: true,
  });
};
const updateOffer = async (offerId, offerData) => {
  if (!offerId) {
    throw new Error(MESSAGES.OFFER_NOT_FOUND);
  }
  const validatedData = await validateOfferData(offerData);

  const existingOffer = await hasExistingOffer(validatedData, offerId);
  if (existingOffer) {
    throw new Error(
      offerData.offerType === 'product' ? MESSAGES.PRODUCT_HAS_OFFER : MESSAGES.CATEGORY_HAS_OFFER,
    );
  }
  return await Offer.findByIdAndUpdate(offerId, validatedData, { new: true, runValidators: true });
};
const getAllOffers = async () => {
  return await Offer.find()
    .populate('productId', 'name')
    .populate('categoryId', 'name')
    .sort({ createdAt: -1 });
};
const getOfferById = async (offerId) => {
  if (!mongoose.isValidObjectId(offerId)) {
    throw new Error('Invalid offer ID');
  }
  const offer = await Offer.findById(offerId)
    .populate('productId', 'name')
    .populate('categoryId', 'name');

  if (!offer) {
    throw new Error('Offer not found');
  }
  return offer;
};
const updateOfferStatus = async (offerId, isActive) => {
  if (!mongoose.isValidObjectId(offerId)) {
    throw new Error('Invalid offer ID');
  }
  if (typeof isActive !== 'boolean') {
    throw new Error('Invalid offer status');
  }
  const offer = await Offer.findByIdAndUpdate(
    offerId,
    { isActive },
    {
      new: true,
      runValidators: true,
    },
  );
  if (!offer) {
    throw new Error('Offer not found');
  }
  return offer;
};
const deleteOffer = async (offerId) => {
  if (!mongoose.isValidObjectId(offerId)) {
    throw new Error('Invalid offer ID');
  }
  const offer = await Offer.findByIdAndDelete(offerId);

  if (!offer) {
    throw new Error('Offer not found');
  }
  return offer;
};
const getBestOfferForProduct = async (productId, variantId = null) => {
  const product = await Product.findOne({
    _id: productId,
    isListed: true,
    isDeleted: false,
  });
  if (!product) {
    throw new Error(MESSAGES.PRODUCT_NOT_FOUND);
  }
  let originalPrice = product.basePrice;
  if (variantId) {
    const variant = await ProductVariant.findOne({
      _id: variantId,
      productId: product._id,
      isActive: true,
    });
    if (!variant) {
      throw new Error(MESSAGES.PRODUCT_VARIANT_NOT_FOUND);
    }
    originalPrice = variant.price;
  }
  const now = new Date();
  const targetConditions = [
    {
      offerType: 'product',
      productId: product._id,
    },
  ];
  if (product.categoryId) {
    targetConditions.push({
      offerType: 'category',
      categoryId: product.categoryId,
    });
  }
  const offers = await Offer.find({
    isActive: true,
    startDate: { $lte: now },
    endDate: { $gte: now },
    $or: targetConditions,
  });
  let bestOffer = null;
  let bestDiscount = 0;
  for (const offer of offers) {
    const discount = Math.round(originalPrice * offer.discountPercentage) / 100;
    if (discount > bestDiscount) {
      bestDiscount = discount;
      bestOffer = offer;
    }
  }
  bestDiscount = Math.min(bestDiscount, originalPrice);
  const finalPrice = Math.round((originalPrice - bestDiscount) * 100) / 100;
  return {
    productId: product._id,
    variantId: variantId || null,
    originalPrice,
    discountAmount: bestDiscount,
    finalPrice,
    discountPercentage: originalPrice > 0 ? Math.round((bestDiscount / originalPrice) * 100) : 0,
    offerType: bestOffer ? bestOffer.offerType : null,
    offerId: bestOffer ? bestOffer._id : null,
  };
};
module.exports = {
  createOffer,
  updateOffer,
  getAllOffers,
  getOfferById,
  updateOfferStatus,
  deleteOffer,
  getBestOfferForProduct,
};
