const Coupon = require('../../model/couponSchema');
const MESSAGES = require('../../constants/messages');
const mongoose = require('mongoose');

const getAvailableCoupons = async () => {
  const now = new Date();
  return await Coupon.find({
    isActive: true,
    startDate: { $lte: now },
    expiryDate: { $gte: now },
    $expr: {
      $lt: ['$usedCount', '$usageLimit'],
    },
  }).sort({ createdAt: -1 });
};
const validateCoupon = async (code, orderAmount) => {
  if (!code) {
    throw new Error(MESSAGES.ENTER_COUPEN_CODE);
  }
  if (!Number.isFinite(orderAmount) || orderAmount < 0) {
    throw new Error(MESSAGES.INVALID_ORDER_AMOUNT);
  }
  const coupon = await Coupon.findOne({
    code: code.trim().toUpperCase(),
  });
  if (!coupon || !coupon.isActive) {
    throw new Error(MESSAGES.COUPON_NOT_FOUND);
  }
  const now = new Date();
  if (now < coupon.startDate) {
    throw new Error(MESSAGES.COUPON_NOT_STARTED);
  }
  if (now > coupon.expiryDate) {
    throw new Error(MESSAGES.COUPON_EXPIRED);
  }
  if (coupon.usedCount >= coupon.usageLimit) {
    throw new Error(MESSAGES.COUPON_USAGE_LIMIT_REACHED);
  }
  if (orderAmount < coupon.minOrderAmount) {
    throw new Error(`Minimum order amount is ${coupon.minOrderAmount.toLocaleString('en-IN')}.`);
  }
  let discount = 0;
  if (coupon.discountType === 'percentage') {
    discount = (orderAmount * coupon.discountValue) / 100;
    if (coupon.maxDiscount != null) {
      discount = Math.min(discount, coupon.maxDiscount);
    }
  } else {
    discount = coupon.discountValue;
  }
  discount = Math.min(discount, orderAmount);
  discount = Math.round(discount * 100) / 100;

  return {
    couponId: coupon._id,
    code: coupon.code,
    discount,
    orderAmount,
    payableAmount: Math.round((orderAmount - discount) * 100) / 100,
  };
};
const recalculateCoupon = async (couponId, orderAmount) => {
  if (!mongoose.Types.ObjectId.isValid(couponId)) {
    throw new Error('Invalid coupon');
  }
  if (!Number.isFinite(orderAmount) || orderAmount < 0) {
    throw new Error(MESSAGES.INVALID_ORDER_AMOUNT);
  }
  const coupon = await Coupon.findById(couponId);
  if (!coupon) {
    return {
      couponId: null,
      couponCode: null,
      discount: 0,
    };
  }
  if (orderAmount < coupon.minOrderAmount) {
    return { couponId: null, couponCode: null, discount: 0 };
  }
  let discount = 0;
  if (coupon.discountType === 'percentage') {
    discount = (orderAmount * coupon.discountValue) / 100;
    if (coupon.maxDiscount != null) {
      discount = Math.min(discount, coupon.maxDiscount);
    }
  } else {
    discount = coupon.discountValue;
  }
  discount = Math.min(discount, orderAmount);
  discount = Math.round(discount * 100) / 100;
  return { couponId: coupon._id, couponCode: coupon.code, discount };
};
module.exports = {
  getAvailableCoupons,
  validateCoupon,
  recalculateCoupon,
};
