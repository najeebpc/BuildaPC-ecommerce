const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
    {
        productId:{
            type:mongoose.Schema.Types.ObjectId,
            ref:'Product',
            required:true
        },
        userId:{
            type:mongoose.Schema.Types.ObjectId,
            ref:'User',
            required:true
        },
        rating:{
            type:Number,
            required:true,
        },
        comment:{
            type:String,
            required:true,
            trim:true
        },
        isVisible:{
            type:Boolean,
            default:true
        }
    },{timestamps:true}
);
reviewSchema.index(
    {productId:1,userId:1},
    {unique:true}
);
module.exports = mongoose.model('Review',reviewSchema);