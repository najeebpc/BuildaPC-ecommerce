const express = require('express');
const router = express.Router();
const { adminAuth, isAdminLogged, isAdminRestPass } = require('../middlewares/authMiddleware');
const adminController = require('../controllers/admin/adminController');
const customerController = require('../controllers/admin/customerController');
const categoryContorller = require('../controllers/admin/categoryController');
const productController = require('../controllers/admin/productController');
const uploadProductImages = require('../middlewares/uploadProductImages');
const reviewController = require('../controllers/admin/reviewController');
const orderController = require('../controllers/admin/orderController');
const notificationController = require('../controllers/admin/notificationController');
const couponController = require('../controllers/admin/couponController');
const offerController = require('../controllers/admin/offerController');
const reportController = require('../controllers/admin/reportController');
// ==================== AUTHENTICATION ====================
router.get('/login', isAdminLogged, adminController.loadLogin);
router.post('/login', adminController.login);
router.get('/forgot-password', adminController.loadForgotPassword);
router.post('/forgot-password', adminController.forgotPassword);
router.get('/verify-otp', adminController.loadVerifyOtp);
router.post('/verify-otp', adminController.verifyOtp);
router.post('/resend-otp', adminController.resendOtp);
router.get('/change-password', isAdminRestPass, adminController.loadChangePassword);
router.post('/change-password', isAdminRestPass,adminController.changePassword);
router.get('/dashboard', adminAuth, adminController.loadDashBoard);
router.get('/dashboard/sales-chart', adminAuth, adminController.loadSalesChartData);
router.get('/logout', adminController.logout);
//Customers
router.get('/users', adminAuth, customerController.loadUsers);
router.post('/users/block/:id',adminAuth, customerController.blockUser);
router.post('/users/unblock/:id',adminAuth, customerController.unblockUser);

//category route
router.get('/categories', adminAuth, categoryContorller.loadCategories);
router.post('/categories', adminAuth, categoryContorller.createCategory);
router.put('/categories/:id', adminAuth, categoryContorller.updateCategory);
router.patch('/categories/:id/status', adminAuth, categoryContorller.updateCategoryStatus);
router.delete('/categories/:id', adminAuth, categoryContorller.deleteCategory);
//product route
router.get('/products', adminAuth, productController.loadProducts);
router.post(
  '/products',
  adminAuth,
  uploadProductImages.array('productImages'),
  productController.createProduct,
);
router.put(
  '/products/:id',
  adminAuth,
  uploadProductImages.fields([{ name: 'newPrimaryImage', maxCount: 1 }, { name: 'galleryImages' }]),
  productController.updateProduct,
);
router.patch('/products/:id/status', adminAuth, productController.updateProductStatus);
router.get('/products/:id/variants', adminAuth, productController.loadProductVariants);
router.post('/products/:id/variants', adminAuth, productController.createProductVariant);
router.put('/products/:id/variants/:variantId', adminAuth, productController.updateProductVariant);
router.delete(
  '/products/:id/variants/:variantId',
  adminAuth,
  productController.deleteProductVariant,
);
router.delete('/products/:id', adminAuth, productController.deleteProduct);
//order routes
router.get('/orders', adminAuth, orderController.loadOrders);
router.patch('/orders/:orderId/status', adminAuth, orderController.updateOrderStatus);
router.get('/orders/:orderId', adminAuth, orderController.loadOrderDetails);
router.patch(
  '/orders/:orderId/items/:itemId/return-review',
  adminAuth,
  orderController.reviewReturnRequest,
);
router.patch(
  '/orders/:orderId/items/:itemId/return-received',
  adminAuth,
  orderController.markReturnReceived,
);
// review routes
router.get('/reviews', adminAuth, reviewController.loadReviews);
router.patch('/reviews/:reviewId/status', adminAuth, reviewController.updateReviewStatus);
router.delete('/reviews/:reviewId', adminAuth, reviewController.deleteReview);
//admin nottification
router.get('/notifications/', adminAuth, notificationController.getNotifications);
router.patch('/notifications/:notificationId/read', adminAuth, notificationController.markAsRead);
// coupon routes
router.get('/coupons', adminAuth, couponController.loadCoupons);
router.post('/coupons', adminAuth, couponController.addCoupon);
router.delete('/coupons/:id', adminAuth, couponController.removeCoupon);
router.patch('/coupons/:id', adminAuth, couponController.updateCouponStatus);
//offer routes
router.get('/offers', adminAuth, offerController.loadOffers);
router.post('/offers', adminAuth, offerController.createOffer);
router.put('/offers/:offerId', adminAuth, offerController.updateOffer);
router.patch('/offers/:offerId/status', adminAuth, offerController.updateOfferStatus);
router.delete('/offers/:offerId', adminAuth, offerController.deleteOffer);

router.get('/reports', adminAuth, reportController.loadSalesReport);
router.get('/reports/export/pdf', adminAuth, reportController.exportSalesPDF);
router.get('/reports/export/excel', adminAuth, reportController.exportSalesExcel);

module.exports = router;
