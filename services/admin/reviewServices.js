const Review = require('../../model/reviewSchema');

const getAllReviews = async ({ search, page }) => {
    const limit = 10;
    const skip = (page - 1) * limit;
    const query = {};
    if (search) {
        query.comment = {
            $regex: search,
            $options: 'i'
        };
    }
    const totalReviews =
        await Review.countDocuments(query);
    const reviews =
        await Review.find(query)
            .populate('productId', 'name primaryImage')
            .populate('userId', 'name')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();
    const totalPages =
        Math.ceil(totalReviews / limit);
    return {
        reviews,
        currentPage: page,
        totalPages
    };
};
const updateReviewStatus = async (reviewId, isVisible) => {
    const review =
        await Review.findByIdAndUpdate(
            reviewId,
            {
                isVisible: isVisible
            },
            {
                new: true
            }
        );
    if (!review) {
        throw new Error('Review not found');
    }
    return review;
};
const deleteReview = async (reviewId) => {
    const review =
        await Review.findByIdAndDelete(reviewId);
    if (!review) {
        throw new Error('Review not found');
    }
    return review;
};
module.exports = {
    getAllReviews,
    updateReviewStatus,
    deleteReview
};