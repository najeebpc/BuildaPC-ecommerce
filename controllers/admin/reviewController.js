const MESSAGES = require('../../constants/messages');
const reviewService =
require('../../services/admin/reviewServices');

const loadReviews = async (req, res) => {
    try {
        const admin = req.session.admin;
        const search = req.query.search || '';
        const page = parseInt(req.query.page) || 1;
        const result =
            await reviewService.getAllReviews({
                search,
                page
            });
        return res.render(
            'admin/reviews',
            {
                reviews: result.reviews,
                currentPage: result.currentPage,
                totalPages: result.totalPages,
                search,
                admin
            }
        );
    } catch (error) {
        console.log('Load reviews error:', error);
        return res.status(500).json({
            success:false,
            message:'failed to load reviews'
        });
    }
};
const updateReviewStatus = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const { isVisible } = req.body;

        await reviewService.updateReviewStatus(
            reviewId,
            isVisible
        );
        return res.json({
            success: true,
            message: isVisible
                ? MESSAGES.REVIEW_SHOWN
                : MESSAGES.REVIEW_HIDDEN
        });
    } catch (error) {

        console.log(
            'Update review status error:',
            error
        );
        return res.status(400).json({
            success: false,
            message:
                error.message ||MESSAGES.REVIEW_UPDATE_FAILED
        });
    }
};
const deleteReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        await reviewService.deleteReview(
            reviewId
        );
        return res.json({
            success: true,
            message: MESSAGES.REVIEW_DELETED
        });
    } catch (error) {
        console.log(
            'Delete review error:',
            error
        );
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};
module.exports = {
    loadReviews,
    updateReviewStatus,
    deleteReview
};