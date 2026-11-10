const orderServices = require('../../services/user/orderServices');
const incoiceServices = require('../../services/user/invoiceServices');
const paymentServices = require('../../services/user/paymentServices');
const crypto = require('crypto');
const MESSAGES = require('../../constants/messages');
const STATUS = require('../../constants/statusCode');
const placeOrder = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const { addressId, paymentMethod } = req.body;
    if (!addressId) {
      return res.status(STATUS.BAD_REQUEST).json({
        success: false,
        message: MESSAGES.ADDRESS_REQUIRED,
      });
    }
    if (!['cod', 'wallet'].includes(paymentMethod)) {
      return res.status(STATUS.BAD_REQUEST).json({
        success: false,
        message: MESSAGES.ADDRESS_PAYMENT_REQUIRED,
      });
    }
    let order;
    if (paymentMethod === 'cod') {
      order = await orderServices.createOrder(
        userId,
        addressId,
        'cod',
        req.session.appliedCoupon?.code || null,
      );
    } else if (paymentMethod === 'wallet') {
      order = await orderServices.createWalletOrder(
        userId,
        addressId,
        req.session.appliedCoupon?.code || null,
      );
    }
    delete req.session.appliedCoupon;
    return res.status(STATUS.OK).json({
      success: true,
      message: MESSAGES.ORDER_PLACED,
      orderId: order.orderId,
    });
  } catch (error) {
    return res.status(STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};
const createOnlinePayment = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const { addressId } = req.body;
    if (!addressId) {
      return res.status(STATUS.BAD_REQUEST).json({
        success: false,
        message: MESSAGES.DELIVERY_ADDRESS_NOT,
      });
    }
    const paymentOrder = await orderServices.createOnlinePayment(
      userId,
      addressId,
      req.session.appliedCoupon?.code || null,
    );
    return res.status(STATUS.OK).json({
      success: true,
      key: process.env.RAZORPAY_KEY_ID,
      ...paymentOrder,
    });
  } catch (error) {
    return res.status(STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};
const verifyOnlinePayment = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const { addressId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    if (!addressId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(STATUS.BAD_REQUEST).json({
        success: false,
        message: MESSAGES.PAYMENT_DETAILS_MISS,
      });
    }
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');
    const exptectedBuffer = Buffer.from(expectedSignature);
    const receivedBuffer = Buffer.from(razorpay_signature);
    if (
      exptectedBuffer.length !== receivedBuffer.length ||
      !crypto.timingSafeEqual(exptectedBuffer, receivedBuffer)
    ) {
      return res.status(STATUS.BAD_REQUEST).json({
        success: false,
        message: MESSAGES.PAYMENT_SIGNATURE_FAILED,
      });
    }
    const order = await orderServices.createPaidOnlineOrder(
      userId,
      addressId,
      razorpay_order_id,
      razorpay_payment_id,
    );
    delete req.session.appliedCoupon;
    return res.status(STATUS.OK).json({
      success: true,
      message: MESSAGES.PAYMENT_SUCCESSFUL,
      orderId: order.orderId,
    });
  } catch (error) {
    console.log('verify online payment error', error);
    return res.status(STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};
const loadOrderSuccess = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const user = req.session.user;
    const orderId = req.params.orderId;
    const order = await orderServices.getOrderByOrderId(userId, orderId);
    return res.render('user/order-success', {
      order,
      user,
    });
  } catch (error) {
    return res.redirect('/');
  }
};
const loadOrders = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const user = req.session.user;
    const orders = await orderServices.getUserOrders(userId);
    return res.render('user/orders', {
      orders,
      user,
    });
  } catch (error) {
    return res.redirect('/account');
  }
};
const cancelOrder = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const orderId = req.params.orderId;
    const { cancellationReason } = req.body;
    await orderServices.cancelOrder(userId, orderId, cancellationReason || '');
    return res.status(STATUS.OK).json({
      success: true,
      message: MESSAGES.ORDER_CANCELED,
    });
  } catch (error) {
    return res.status(STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};
const cancelOrderItem = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const { orderId, itemId } = req.params;
    const { cancellationReason } = req.body;
    const updatedOrder = await orderServices.cancelOrderItem(
      userId,
      orderId,
      itemId,
      cancellationReason,
    );
    return res.status(STATUS.OK).json({
      success: true,
      message: MESSAGES.ORDER_ITEM_CANCELLED,
      orderStatus: updatedOrder.orderStatus,
    });
  } catch (error) {
    console.log('cancel order item error', error);
    return res.status(STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || 'Unable to cancel item',
    });
  }
};
const checkCancellationImapct = async (req, res) => {
  try {
    const { orderId, itemId } = req.params;
    const result = await orderServices.checkCancellationImapct(req.session.user, orderId, itemId);
    return res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    return res.status(STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};
const returnOrder = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const orderId = req.params.orderId;
    const { returnReason } = req.body;
    if (!returnReason || !returnReason.trim()) {
      return res.status(STATUS.BAD_REQUEST).json({
        success: false,
        message: MESSAGES.RETURN_REASON,
      });
    }
    await orderServices.returnOrder(userId, orderId, returnReason);
    return res.status(STATUS.OK).json({
      success: true,
      message: MESSAGES.RETURN_REQUESTED,
    });
  } catch (error) {
    return res.status(STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};
const returnOrderItem = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const { orderId, itemId } = req.params;
    const { returnReason } = req.body;
    const updatedOrder = await orderServices.returnOrderItem(userId, orderId, itemId, returnReason);
    return res.status(STATUS.OK).json({
      success: true,
      message: MESSAGES.RETURN_REQUESTED,
    });
  } catch (error) {
    console.log(error);
    return res.status(STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};
const loadOrderDetails = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const user = req.session.user;
    const orderId = req.params.orderId;
    const order = await orderServices.getOrderDetails(userId, orderId);
    return res.render('user/order-details', {
      order,
      user,
    });
  } catch (error) {
    console.log('Failed to load order', error);
    return res.redirect('account/orders');
  }
};
const downloadInvoice = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const orderId = req.params.orderId;
    await incoiceServices.generateInvoice(userId, orderId, res);
  } catch (error) {
    console.log('Download invoice error', error);
  }
};
module.exports = {
  placeOrder,
  createOnlinePayment,
  verifyOnlinePayment,
  loadOrderSuccess,
  loadOrders,
  cancelOrder,
  cancelOrderItem,
  checkCancellationImapct,
  returnOrder,
  returnOrderItem,
  loadOrderDetails,
  downloadInvoice,
};
