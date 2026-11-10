const couponServices = require('../../services/admin/couponServices');
const MESSAGES = require('../../constants/messages');
const STATUS = require('../../constants/statusCode');
const loadCoupons = async (req, res) => {
  try {
    const coupons = await couponServices.getAllCoupons();
    const admin = req.session.admin;
    res.render('admin/coupons', {
      coupons,
      admin,
    });
  } catch (error) {
    res.redirect('/admin/dashboard');
  }
};
const addCoupon = async (req, res) => {
  try {
    await couponServices.createCoupon(req.body);
    return res.status(STATUS.OK).json({
      success: true,
      message: MESSAGES.COUPON_CREATED,
    });
  } catch (error) {
    console.log('error creating coupon', error);
    return res.status(STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};
const updateCouponStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    const couponId = req.params.id;
    if (typeof isActive !== 'boolean') {
      return res.status(STATUS.BAD_REQUEST).json({
        success: false,
        message: MESSAGES.COUPON_STATUS_INVALID,
      });
    }
    const result = await couponServices.updateCouponStatus(couponId, isActive);
    return res.status(STATUS.OK).json({
      success: true,
      message: result.isActive ? MESSAGES.COUPON_ACTIVATED : MESSAGES.COUPON_DISABLED,
    });
  } catch (error) {
    return res.status(STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};
const removeCoupon = async (req, res) => {
  try {
    await couponServices.deleteCoupon(req.params.id);
    return res.status(STATUS.OK).json({
      success: true,
      message: MESSAGES.COUPON_DELETED,
    });
  } catch (error) {
    console.log('error deleting coupon', error);
    return res.status(STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};
module.exports = {
  loadCoupons,
  addCoupon,
  removeCoupon,
  updateCouponStatus,
};
