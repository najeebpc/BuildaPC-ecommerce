const Review = require('../../model/reviewSchema');
const mongoose = require('mongoose');

const createReview = async(productId, userId, rating, comment)=>{
    const existingReview = await Review.findOne(
        {productId,userId}
    )
    if(existingReview){
        throw new Error('You have already reviewed this product');
    }
    const review = await Review.create({
        productId,
        userId,
        rating,
        comment
    });
    return review;
}
const getProductReviews = async(productId)=>{
    const reviews = await Review.find({
        productId,
        isVisible:true
    }).populate('userId','name profileImage').sort({createdAt:-1}).lean();
    return reviews;
}
const getProductRatingSummery = async(productId)=>{
    const result = await Review.aggregate([
        {
            $match:{
                productId:new mongoose.Types.ObjectId(productId),
                isVisible:true
            }
        },
        {
            $group:{
                _id:null,averageRating:{$avg:'$rating'},
                totalReviews:{$sum:1}
            }
        }
    ]);
    if(result.length===0){
        return{averageRating:0,totalReviews:0}
    }
    return {averageRating:Number(result[0].averageRating.toFixed(1)),
        totalReviews:result[0].totalReviews
    }
}
module.exports ={
    createReview,
    getProductReviews,
    getProductRatingSummery
}