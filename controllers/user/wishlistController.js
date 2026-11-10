const userServices = require('../../services/user/userServices');
const wishlistServices = require('../../services/user/wishlistServices');
const MESSAGES = require('../../constants/messages');
const STATUS = require('../../constants/statusCode');
const loadWhishlist = async (req, res) => {
  try {
    const userId = req.session.user;
    const user = await userServices.findUserById(userId);
    const products = await wishlistServices.getWishlist(userId);
    res.render('user/wishlist', {
      user,
      products,
    });
  } catch (error) {
    console.log(error);
    return res.status(STATUS.INTERNAL_SERVER_ERROR);
  }
};
const addToWishlist = async (req, res) => {
  try {
    const userId = req.session.user;
    const { productId, variantId, fromCart } = req.body;
    await wishlistServices.addToWishlist(userId, productId, variantId, fromCart === true);
    return res.status(STATUS.OK).json({
      success: true,
      message: MESSAGES.WISHLIST_ADDED,
    });
  } catch (error) {
    return res.status(STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};
const removeFromWishlist = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const productId = req.params.id;
    const { variantId } = req.body;
    await wishlistServices.removeFromWishlist(userId, productId, variantId || null);
    return res.status(STATUS.OK).json({
      success: true,
      message: MESSAGES.WISHLIST_REMOVED,
    });
  } catch (error) {
    return res.status(STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};
const removeProductIfExists = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const productId = req.params.id;
    const result = await wishlistServices.removeProductIfExists(userId, productId);
    return res.status(STATUS.OK).json({
      success: true,
      removed: result.removed,
    });
  } catch (error) {
    return res.status(STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};
module.exports = {
  loadWhishlist,
  addToWishlist,
  removeFromWishlist,
  removeProductIfExists,
};
