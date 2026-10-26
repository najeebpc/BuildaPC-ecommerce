const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema(
    {
        productId:{
            type:mongoose.Schema.Types.ObjectId,
            ref:'Product',
            required:true
        },
        variantId:{
            type:mongoose.Schema.Types.ObjectId,
            ref:'ProductVariant',
            default:null
        },
        quantity:{
            type:Number,
            required:true,
            min:1
        }
    },{_id:true}
);
const cartSchema = new mongoose.Schema(
    {
        userId:{
            type:mongoose.Schema.Types.ObjectId,
            ref:'User',
            required:true,
            unique:true
        },
        items:{
            type:[cartItemSchema],
            dafault:[]
        }
    },
    {timestamps:true}
);
module.exports = mongoose.model('Cart',cartSchema);