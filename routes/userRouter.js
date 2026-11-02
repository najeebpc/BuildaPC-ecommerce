const express = require("express");
const router = express.Router();
const userController = require("../controllers/user/userController");
const accountController = require("../controllers/user/accountController.js");
const addressController = require('../controllers/user/addressController');
const productController = require('../controllers/user/productController');
const wishlistController = require('../controllers/user/wishlistController');
const walletController = require('../controllers/user/walletController');
const couponController = require('../controllers/user/couponController');
const cartController = require('../controllers/user/cartController');
const checkoutController = require('../controllers/user/checkoutController');
const orderController = require('../controllers/user/orderController');
const refferralControlller = require('../controllers/user/referralController');

const passport = require("passport");
const {isVerified,isLogged,isAuthenticated,isResetPassword, adminAuth} = require("../middlewares/authMiddleware.js");
const uploadProfileImage = require('../middlewares/uploadMiddleware.js');
const { cancelOrderItem } = require("../services/user/orderServices.js");

router.get('/',userController.loadHomepage);
//sign up Management
router.get('/signup',isLogged,userController.loadSignup);
router.post('/signup',userController.signup);
router.get('/verify-otp',isVerified,userController.loadVerify)
router.post('/verify-otp',userController.verifyOtp);
router.post('/resend-otp',userController.resendOtp);
router.get("/auth/google",passport.authenticate("google",{scope:["profile","email"],prompt:'select_account'}));
router.get('/auth/google/callback',passport.authenticate('google',{failureRedirect:'/signup'}),userController.googleCallback);
//login route
router.get('/login',isLogged,userController.loadLogin);
router.post('/login',userController.login);
router.get('/forgot-password',userController.loadForgotPassword);
router.post('/forgot-password',userController.forgotPassword);
router.get('/change-password',isResetPassword,userController.loadChangePassword);
router.post('/change-password',userController.changePassword);
//account route
router.get('/account',isAuthenticated,accountController.loadAccount);
router.post('/account/profile-image',isAuthenticated,uploadProfileImage.single('profileImage'),accountController.uploadProfileImage);
router.post('/account/profile-image/remove',isAuthenticated,accountController.removeProfileImage)
router.post('/update-profile',isAuthenticated,accountController.updateProfile);
router.get('/account/change-email',isAuthenticated,accountController.loadChangeEmail);
router.post('/account/change-email',isAuthenticated,accountController.changeEmailOtp);
router.post('/account/change-password',isAuthenticated,accountController.changePassword);

// Address route
router.get('/account/address',isAuthenticated,addressController.loadAddress);
router.post('/account/address',isAuthenticated,addressController.addAddress);
router.get('/account/address/:id',isAuthenticated,addressController.getAddress)
router.post('/account/address/:id/update',isAuthenticated,addressController.editAddress)
router.delete('/account/address/:id',isAuthenticated,addressController.deleteAddress);
router.patch('/account/address/:addressId/default',isAuthenticated,addressController.setDefaultAddress);
//Wishlist routes
router.get('/account/wishlist',isAuthenticated,wishlistController.loadWhishlist);
router.post('/account/wishlist',isAuthenticated,wishlistController.addToWishlist);
router.delete('/account/wishlist/:id',isAuthenticated,wishlistController.removeFromWishlist);
router.delete('/account/wishlist/remove-if-exists/:id',isAuthenticated,wishlistController.removeProductIfExists);
// wallet routes
router.get('/account/wallet',isAuthenticated,walletController.loadWallet);
//coupons route
router.get('/account/coupons',isAuthenticated,couponController.loadAvailableCoupon);
//referral route
router.get('/account/referral',isAuthenticated,refferralControlller.loadReferralPage);
//product routes
router.get('/products',productController.loadProducts);
router.get('/products/preBuilt',productController.loadPreBuilt);
router.get('/product/:id',productController.loadProductDetails);
router.post('/product/:id/reviews',isAuthenticated,productController.createReview);
//cart routes
router.get('/cart',isAuthenticated,cartController.loadCart);
router.post('/cart',isAuthenticated,cartController.addtoCart);
router.delete('/cart/:id',isAuthenticated,cartController.removeFromCart);
router.patch('/cart/:id/quantity',isAuthenticated,cartController.updateCartQuantity);
//checkout routes
router.get('/checkout',isAuthenticated,checkoutController.loadCheckout);
router.post('/checkout/validate',isAuthenticated,checkoutController.validateCheckout);
router.post('/checkout/apply-coupon',isAuthenticated,checkoutController.applyCoupon);
router.post('/checkout/remove-coupon',isAuthenticated,checkoutController.removeCoupon);
router.get('/checkout/payment',isAuthenticated,checkoutController.loadPayment);

//order routes
router.post('/order',isAuthenticated,orderController.placeOrder);
router.post('/order/online/create',isAuthenticated,orderController.createOnlinePayment);
router.post('/order/online/verify',isAuthenticated,orderController.verifyOnlinePayment);
router.get('/order-success/:orderId',isAuthenticated,orderController.loadOrderSuccess);
router.get('/account/orders',isAuthenticated,orderController.loadOrders);
router.patch('/account/orders/:orderId/cancel',isAuthenticated,orderController.cancelOrder);
router.patch('/account/orders/:orderId/items/:itemId/cancel',isAuthenticated,orderController.cancelOrderItem);
router.get('/account/orders/:orderId/items/:itemId/cancellation-impact',isAuthenticated,orderController.checkCancellationImapct);
router.patch('/account/orders/:orderId/return',isAuthenticated,orderController.returnOrder);
router.patch('/account/orders/:orderId/items/:itemId/return',isAuthenticated,orderController.returnOrderItem)
router.get('/account/orders/:orderId',isAuthenticated,orderController.loadOrderDetails);
router.get('/account/orders/:orderId/invoice',isAuthenticated,orderController.downloadInvoice);

router.get('/logout',isAuthenticated,userController.logout);

module.exports = router;