const Cart = require('../model/cartSchema');

const cartCount = async (req, res, next) => {
  try {
    res.locals.cartCount = 0;
    if (req.session.user) {
      const cart = await Cart.findOne({ userId: req.session.user._id }).select('items.quantity');
      if (cart) {
        res.locals.cartCount = cart.items.reduce((total, item) => total + item.quantity, 0);
      }
    }
    next();
  } catch (error) {
    console.log('Cart count error', error);
    res.locals.cartCount = 0;
    next();
  }
};
module.exports = cartCount;
