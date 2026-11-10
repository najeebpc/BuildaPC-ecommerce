const productServices = require('../../services/user/productServices');
const userServices = require('../../services/user/userServices');
const categoryServieces = require('../../services/admin/categoryServices');
const reviewServices = require('../../services/user/reviewServices');
const MESSAGES = require('../../constants/messages');
const STATUS = require('../../constants/statusCode');

const loadProducts = async (req, res) => {
  try {
    const userId = req.session.user?._id || null;
    const search = req.query.search || '';
    const category = req.query.category
      ? Array.isArray(req.query.category)
        ? req.query.category
        : [req.query.category]
      : [];
    const minPrice = req.query.minPrice || '';
    const maxPrice = req.query.maxPrice || '';
    const sort = req.query.sort || 'default';
    const page = parseInt(req.query.page) || 1;
    const result = await productServices.getProducts({
      search,
      category,
      minPrice,
      maxPrice,
      sort,
      page,
      productType: 'component',
      userId,
    });

    const user = await userServices.findUserById(req.session.user);
    const categories = await categoryServieces.getCategoriesWithProductCount();
    res.render('user/products', {
      products: result.products,
      categories: categories,
      currentPage: result.currentPage,
      totalPages: result.totalPages,
      totalProducts: result.totalProducts,
      search,
      category,
      minPrice,
      maxPrice,
      sort,
      user,
    });
  } catch (error) {
    console.log('Load product error');
    console.log(error);
    return res.status(STATUS.INTERNAL_SERVER_ERROR);
  }
};
const loadPreBuilt = async (req, res) => {
  try {
    const search = req.query.search || '';
    const minPrice = req.query.minPrice || '';
    const maxPrice = req.query.maxPrice || '';
    const sort = req.query.sort || 'default';
    const page = parseInt(req.query.page) || 1;
    const result = await productServices.getProducts({
      search,
      minPrice,
      maxPrice,
      sort,
      page,
      productType: 'pre_built',
    });
    const user = await userServices.findUserById(req.session.user);
    res.render('user/preBuilt', {
      products: result.products,
      currentPage: result.currentPage,
      totalPages: result.totalPages,
      totalProducts: result.totalProducts,
      search,
      minPrice,
      maxPrice,
      sort,
      user,
    });
  } catch (error) {
    console.log(error);
    res.status(STATUS.INTERNAL_SERVER_ERROR).send('somthing went wrong');
  }
};
const loadProductDetails = async (req, res) => {
  try {
    const productId = req.params.id;
    const userId = req.session.user?._id || null;
    const user = await userServices.findUserById(req.session.user);
    const product = await productServices.getProductDetails(productId, userId);
    const reviews = await reviewServices.getProductReviews(productId);
    const ratingSummary = await reviewServices.getProductRatingSummery(productId);
    if (!product) {
      return res.redirect('/products');
    }
    res.render('user/productDetails', {
      product,
      user,
      reviews,
      ratingSummary,
    });
  } catch (error) {
    console.log(error);
    return res.redirect('/products');
  }
};
const createReview = async (req, res) => {
  try {
    const productId = req.params.id;
    const userId = req.session.user;
    const { rating, comment } = req.body;
    if (!rating) {
      return res.status(STATUS.BAD_REQUEST).json({
        success: false,
        message: MESSAGES.REVIEW_RATING_REQ,
      });
    }
    if (!comment || !comment.trim()) {
      return res.status(STATUS.BAD_REQUEST).json({
        success: false,
        message: MESSAGES.REVIEW_COMMENT_NEED,
      });
    }
    await reviewServices.createReview(productId, userId, rating, comment);
    return res.status(STATUS.OK).json({
      success: true,
      message: MESSAGES.REVIEW_ADDED,
    });
  } catch (error) {
    console.log(error);
    return res.status(STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || MESSAGES.REVIEW_ADDED_FAILED,
    });
  }
};
module.exports = {
  loadProducts,
  loadPreBuilt,
  loadProductDetails,
  createReview,
};
