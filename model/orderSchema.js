const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
    {
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        productName: {
            type: String,
            required: true
        },
        productImage: {
            type: String,
            default: ''
        },
        variantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ProductVariant',
            default: null
        },
        variantAttributes: [
            {
                name: String,
                value: String
            }
        ],
        price: {
            type: Number,
            required: true,
            min: 0
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        originalPrice: {
            type: Number,
            required: true,
            min: 0
        },
        discountAmount:{
            type:Number,
            default:0,
            min:0
        },
        couponDiscountAmount:{
            type:Number,
            default:0,
            min:0
        },
        couponDiscountAdjusted:{
            type:Boolean,
            default:false
        },
        itemStatus:{
            type:String,
            enum:['active','cancelled','returned'],
            default:'active'
        },
        cancellationReason:{
            type:String,
            default:''
        },
        cancelledAt:{
            type:Date,
            default:null
        },
        returnReason: {
            type: String,
            default: ''
        },
        returnRequestedAt: {
            type: Date,
            default: null
        },
        returnStatus: {
            type: String,
            enum: ['none', 'requested', 'approved', 'rejected', 'received'],
            default: 'none'
        },
        returnRejectedReason: {
            type: String,
            default: ''
        },
        returnReceivedAt: {
            type: Date,
            default: null
        },
        returnStockRestored: {
            type: Boolean,
            default: false
        },
        retundAmount:{
            type:Number,
            defualt:0,
            min:0
        }
    },
);
const orderSchema = new mongoose.Schema(
    {
        orderId: {
            type: String,
            required: true,
            unique: true
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        items: {
            type: [orderItemSchema],
            required: true
        },
        shippingAddress: {
            fullName: {
                type: String,
                required: true
            },
            phone: {
                type: String,
                required: true
            },
            addressLine1: {
                type: String,
                required: true
            },
            addressLine2: {
                type: String,
                default: ''
            },
            city: {
                type: String,
                required: true
            },
            state: {
                type: String,
                required: true
            },
            pincode: {
                type: String,
                required: true
            }
        },
        subtotal: {
            type: Number,
            required: true,
             min: 0
        },
        couponId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Coupon',
            default: null
        },
        couponCode: {
            type: String,
            default: null
        },
        couponDiscount: {
            type: Number,
            default: 0,
            min: 0
        },
        totalAmount: {
            type: Number,
            required: true,
            min: 0
        },
        paymentMethod: {
            type: String,
            enum: ['cod', 'online','wallet'],
            required: true
        },
        paymentStatus: {
            type: String,
            enum: ['pending', 'paid', 'failed'],
            default: 'pending'
        },
        razorpayOrderId: {
            type: String,
            default: null
        },
        razorpayPaymentId: {
            type: String,
            default: null
        },
        orderStatus: {
            type: String,
            enum: [
                'pending',
                'shipped',
                'out for delivery',
                'delivered',
                'cancelled',
                'Return requested',
                'Return approved',
                'Return rejected',
                'Return received'
            ],
            default: 'pending'
        },
        cancellationReason: {
            type: String,
            default: ''
        },

        cancelledAt: {
            type: Date,
            default: null
        },
        returnReason: {
            type: String,
            default: ''
        },

        returnedAt: {
            type: Date,
            default: null
        },
        returnStockRestored:{
            type:Boolean,
            default:false
        },
        returnReceivedAt:{
            type:Date,
            default:null
        }
    },
    {
        timestamps: true
    },
    
);

module.exports = mongoose.model('Order', orderSchema);