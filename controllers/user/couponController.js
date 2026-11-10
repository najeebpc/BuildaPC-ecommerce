const STATUS = require('../../constants/statusCode');
const couponServices = require('../../services/user/couponServices');

const loadAvailableCoupon = async (req, res) => {
  try {
    const coupons = await couponServices.getAvailableCoupons();
    res.render('user/coupons', {
      coupons,
      user: req.session.user,
    });
  } catch (error) {
    console.log('load coupon error', error);
    res.status(STATUS.INTERNAL_SERVER_ERROR);
  }
};
module.exports = {
  loadAvailableCoupon,
};
