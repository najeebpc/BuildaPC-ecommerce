const Order = require('../../model/orderSchema');
const User = require('../../model/userSchema');
const mongoose = require('mongoose');
const Product = require('../../model/productSchema');
const ProductVariant = require('../../model/variantSchema');
const Coupon = require('../../model/couponSchema');
const MESSAGES = require('../../constants/messages');
const walletServices = require('../../services/user/walletServices');
const referralServices = require('../../services/user/referralServices');
const getAllOrders = async ({ search = '', status = '', sort = 'newest', page = 1 }) => {
  const limit = 10;
  const skip = (page - 1) * limit;
  const query = {};
  if (search) {
    const users = await User.find({
      name: {
        $regex: search,
        $options: 'i',
      },
    }).select('_id');
    const userIds = users.map((user) => user._id);
    query.$or = [
      {
        orderId: {
          $regex: search,
          $options: 'i',
        },
      },
      {
        userId: {
          $in: userIds,
        },
      },
    ];
  }
  if (status) {
    query.orderStatus = status;
  }
  const sortOption = sort === 'oldest' ? { createdAt: 1 } : { createdAt: -1 };
  const totalOrders = await Order.countDocuments(query);

  const orders = await Order.find(query)
    .populate('userId', 'name email')
    .sort(sortOption)
    .skip(skip)
    .limit(limit)
    .lean();
  const totalPages = Math.ceil(totalOrders / limit);
  return {
    orders,
    currentPage: page,
    totalPages,
  };
};
const updateOrderStatus = async (orderId, orderStatus) => {
  const session = await mongoose.startSession();
  try {
    let order;
    await session.withTransaction(async () => {
      order = await Order.findOne({ orderId }).session(session);
      if (!order) {
        throw new Error(MESSAGES.ORDER_NOT_FOUND);
      }
      const statusTransitions = {
        pending: ['shipped', 'cancelled'],
        shipped: ['out for delivery', 'cancelled'],
        'out for delivery': ['delivered', 'cancelled'],
        delivered: [],
        cancelled: [],
      };
      if (!statusTransitions[order.orderStatus]?.includes(orderStatus)) {
        throw new Error(MESSAGES.INVALID_ORDER_TRANSITION);
      }
      if (orderStatus === 'cancelled') {
        if (order.orderStatus === 'cancelled') {
          throw new Error(MESSAGES.ORDER_ALREADY_CANCELLED);
        }
        for (const item of order.items) {
          if (['cancelled', 'returned'].includes(item.itemStatus)) {
            continue;
          }
          const result = item.variantId
            ? await ProductVariant.updateOne(
                { _id: item.variantId },
                { $inc: { stock: item.quantity } },
                { session },
              )
            : await Product.updateOne(
                { _id: item.productId },
                { $inc: { stockLevel: item.quantity } },
                { session },
              );
          if (result.matchedCount !== 1) {
            throw new Error(`Product not found: ${item.productName}`);
          }
          item.itemStatus = 'cancelled';
          item.cancelledAt = new Date();
        }
        if (order.paymentStatus === 'paid' && Number(order.totalAmount) > 0) {
          await walletServices.changeWalletBalance({
            userId: order.userId,
            type: 'credit',
            amount: Number(order.totalAmount),
            description: `Refund for cancelled order ${order.orderId}`,
            session,
          });
        }
      }
      order.orderStatus = orderStatus;
      await order.save({ session });
    });
    if (order.orderStatus === 'delivered') {
      await referralServices.referralReward(order._id);
    }
    return order;
  } finally {
    await session.endSession();
  }
};
const getOrderDetails = async (orderId) => {
  const order = await Order.findOne({ orderId }).populate('userId', 'name email').lean();
  if (!order) {
    throw new Error(MESSAGES.ORDER_NOT_FOUND);
  }
  return order;
};

const reviewReturnRequest = async (orderId, itemId, decision) => {
  const allowedDecisions = ['approved', 'rejected'];
  if (!allowedDecisions.includes(decision)) {
    throw new Error(MESSAGES.INVALID_DECISION);
  }
  const order = await Order.findOne({ orderId });
  if (!order) {
    throw new Error(MESSAGES.ORDER_NOT_FOUND);
  }
  const item = order.items.id(itemId);
  if (!item) {
    throw new Error('Order item not found');
  }
  if (item.returnStatus !== 'requested') {
    throw new Error('This item does not have a pending return request');
  }
  item.returnStatus = decision;
  await order.save();
  return order;
};
const markReturnReceived = async (orderId, itemId) => {
  const session = await mongoose.startSession();
  try {
    let updatedOrder;
    await session.withTransaction(async () => {
      const order = await Order.findOne({ orderId }).session(session);
      if (!order) {
        throw new Error(MESSAGES.ORDER_NOT_FOUND);
      }
      const item = order.items.id(itemId);
      if (!item) {
        throw new Error(MESSAGES.ORDER_ITEM_NOT_FOUND);
      }
      if (item.returnStatus !== 'approved') {
        throw new Error(MESSAGES.RETURN_NOT_APPROVED);
      }
      if (item.returnStockRestored) {
        throw new Error(MESSAGES.STOCK_ALREADY_RESTORED);
      }
      if (item.itemStatus !== 'active') {
        throw new Error(MESSAGES.ORDER_ITEM_CANNOT_RETURN);
      }
      const itemTotal = Number((item.price * item.quantity).toFixed(2));
      const itemDiscount = Number((item.couponDiscountAmount || 0).toFixed(2));
      if (
        !Number.isFinite(itemTotal) ||
        itemTotal <= 0 ||
        itemTotal > order.subTotal ||
        !Number.isFinite(itemDiscount) ||
        itemDiscount < 0 ||
        itemDiscount > itemTotal
      ) {
        throw new Error(MESSAGES.INVALID_ITEM_AMOUNT);
      }
      const newSubtotal = Number((order.subtotal - itemTotal).toFixed(2));
      let remainingDiscount = order.couponDiscount;
      if (remainingDiscount > 0) {
        remainingDiscount = Number((remainingDiscount - itemDiscount).toFixed(2));
      }
      if (order.couponId && newSubtotal > 0) {
        const coupon = await Coupon.findById(order.couponId).session(session);
        if (!coupon || newSubtotal < coupon.minOrderAmount) {
          remainingDiscount = 0;
        }
      } else {
        remainingDiscount = 0;
      }
      const newTotalAmount = Number((newSubtotal - remainingDiscount).toFixed(2));
      const refundAmount = Number((order.totalAmount - newTotalAmount).toFixed(2));
      if (!Number.isFinite(refundAmount) || refundAmount < 0) {
        throw new Error(MESSAGES.INVALID_REFUND);
      }
      let stockResult;
      if (item.variantId) {
        stockResult = await ProductVariant.updateOne(
          { _id: item.variantId },
          { $inc: { stock: item.quantity } },
          { session },
        );
      } else {
        stockResult = await Product.updateOne(
          { _id: item.productId },
          { $inc: { stockLevel: item.quantity } },
          { session },
        );
      }
      if (stockResult.matchedCount !== 1) {
        throw new Error(`Product not found: ${item.productName}`);
      }
      if (order.paymentStatus === 'paid') {
        await walletServices.changeWalletBalance({
          userId: order.userId,
          type: 'credit',
          amount: refundAmount,
          description: `Refund for returned item ${item.productName} in order ${order.orderId}`,
          session,
        });
      }
      item.itemStatus = 'returned';
      item.returnStatus = 'received';
      item.returnStockRestored = true;
      item.returnReceivedAt = new Date();
      item.refundAmount = order.paymentStatus === 'paid' ? refundAmount : 0;
      order.subtotal = newSubtotal;
      order.couponDiscount = remainingDiscount;
      order.totalAmount = newTotalAmount;
      await order.save({ session });
      updatedOrder = order;
    });
    return updatedOrder;
  } finally {
    await session.endSession();
  }
};
module.exports = {
  getAllOrders,
  updateOrderStatus,
  getOrderDetails,
  reviewReturnRequest,
  markReturnReceived,
};
