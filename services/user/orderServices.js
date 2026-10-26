const crypto = require('crypto');
const mongoose = require('mongoose');
const Order = require('../../model/orderSchema');
const Cart = require('../../model/cartSchema');
const Product = require('../../model/productSchema');
const ProductVariant = require('../../model/variantSchema');
const Address = require('../../model/addressSchema');
const MESSAGES = require('../../constants/messages');
const razorpay = require('../../services/user/paymentServices');
const notificationServices = require('../../services/admin/notificationServices');
const walletServices = require('../../services/user/walletServices');
const pricingServices = require('../../services/user/pricingServices');
const couponServices = require('../../services/user/couponServices');

const generateOrderId = ()=>{
    const randomPart = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `ORD-${Date.now()}-${randomPart}`;
}
const getOrderPricing = async(userId, couponCode =null)=>{
    const {orderItems, subtotal} = await pricingServices.calculateCartSubtotal(userId);
    let coupon = null;
    let discount = 0;
    if(couponCode){
        coupon = await couponServices.validateCoupon(couponCode,subtotal);
        discount = coupon.discount;
    }
    const totalAmount = Math.round((subtotal-discount)*100)/100 ;
    return{
        orderItems,
        subtotal,
        couponId:coupon?coupon.couponId:null,
        couponCode:coupon?coupon.code:null,
        couponDiscount:discount,
        totalAmount
    }
}
const createOrder = async(userId, addressId, paymentMethod,couponCode=null)=>{
    const cart = await Cart.findOne({userId});
    if(!cart||cart.items.length===0){
        throw new Error(MESSAGES.CART_EMPTY);
    }
    const address = await Address.findOne({_id:addressId,userId});
    if(!address){
        throw new Error('Delivery address not found');
    }
    if(paymentMethod!=='cod'){
        throw new Error('invalid payment method');
    }
    const {
        orderItems,
        subtotal,
        couponId,
        couponCode:appliedCouponCode,
        couponDiscount,
        totalAmount
    }= await getOrderPricing(userId, couponCode);

    for(const item of cart.items){
        if(item.variantId){
            const updatedVariant= await ProductVariant.findOneAndUpdate(
                {
                    _id:item.variantId,
                    stock:{$gte:item.quantity}
                },
                {
                    $inc:{
                        stock:-item.quantity
                    }
                },
                {new:true}
            );
            if(!updatedVariant){
                throw new Error('Stock changed. Please review your cart and try again');
            }
        }else{
            const updatedProduct = await Product.findOneAndUpdate(
                {
                    _id:item.productId,
                    stockLevel:{$gte:item.quantity}
                },
                {
                    $inc:{
                        stockLevel:-item.quantity
                    }
                },{new:true}
            );
            if(!updatedProduct){
                throw new Error('Stock changed. Please review your cart and try again');
            }
        }
    }
    const order = await Order.create({
        orderId:generateOrderId(),
        userId,
        items:orderItems,
        shippingAddress:{
            fullName: address.fullName,
            phone: address.phone,
            addressLine1: address.addressLine1,
            addressLine2: address.addressLine2,
            city: address.city,
            state: address.state,
            pincode: address.pincode
        },
        subtotal,
        couponId,
        couponCode:appliedCouponCode,
        couponDiscount,
        totalAmount,
        paymentMethod,
        paymentStatus:'pending',
        orderStatus:'pending'
    });
    cart.items=[];
    await cart.save();
    return order;

    };
const createOnlinePayment = async(userId, addressId, couponCode=null)=>{
    const cart = await  Cart.findOne({userId})
    if(!cart||cart.items.length===0){
        throw new Error(MESSAGES.CART_EMPTY)
    }
    const address = await Address.findOne({_id:addressId, userId});
    if(!address){
        throw new Error(MESSAGES.DELIVERY_ADDRESS_NOT)      
    }
    const {
        subtotal,
        couponId,
        couponCode:appliedCouponCode,
        couponDiscount,
        totalAmount
    } =await getOrderPricing(userId, couponCode)
    console.log('Online payment amount:',{
        totalAmount,
        razorpayAmount:Math.round(totalAmount*100)
    })
    const paymentOrder = await razorpay.orders.create({
        amount:Math.round(totalAmount*100),
        currency:'INR',
        receipt:`BP${Date.now()}`,
        notes:{
            userId:String(userId),
            addressId:String(addressId),
            subtotal:String(subtotal),
            couponId:couponId?String(couponId):'',
            couponCode:appliedCouponCode||'',
            couponDiscount:String(couponDiscount),
            totalAmount:String(totalAmount)
        }
    });
    return{
        razorpayOrderId:paymentOrder.id,
        amount:paymentOrder.amount,
        currency:paymentOrder.currency
    }
}
const createPaidOnlineOrder = async(userId, addressId, razorpayOrderId, razorpayPaymentId)=>{
    const existingOrder = await Order.findOne({razorpayOrderId});
    if(existingOrder){
        if(String(existingOrder.userId)!== String(userId)){
            throw new Error(MESSAGES.ORDER_NOT_FOR_THIS_USER);
        }
        return existingOrder;
    }
    const cart = await Cart.findOne({userId});
    if(!cart||cart.items.length===0){
        throw new Error(MESSAGES.CART_EMPTY);
    }
    const address = await Address.findOne({_id:addressId,userId});
    if(!address){
        throw new Error(MESSAGES.DELIVERY_ADDRESS_NOT);
    }
    const paymentOrder = await razorpay.orders.fetch(razorpayOrderId);
    const notes = paymentOrder.notes||{};
    if(
        paymentOrder.status !=='paid'||
        String(notes.userId)!== String(userId)||
        String(notes.addressId) !== String(addressId)||
        paymentOrder.currency !=='INR'
    ){
        throw new Error(MESSAGES.PAYMENT_FAILED);
    }
    const payment = await razorpay.payments.fetch(razorpayPaymentId);
    if(
        payment.order_id !== razorpayOrderId||
        payment.status !=='captured'||
        payment.amount !== Math.round(paymentOrder.amount)||
        payment.currency !== 'INR'
    ){
        throw new Error(MESSAGES.PAYMENT_FAILED);
    }
    const subtotal = Number(notes.subtotal);
    const couponDiscount = Number(notes.couponDiscount || 0);
    const totalAmount = Number(notes.totalAmount);
    const couponId = notes.couponId || null;
    const appliedCouponCode = notes.couponCode || null;
    if(
        !Number.isFinite(subtotal)||
        !Number.isFinite(couponDiscount)||
        !Number.isFinite(totalAmount)||
        subtotal<0 ||
        couponDiscount<0||
        totalAmount<0||
        Math.round(totalAmount *100)!==paymentOrder.amount||
        Math.round((subtotal-couponDiscount)*100) !==Math.round(totalAmount*100)
    ){
        throw new Error(MESSAGES.PAYMENT_FAILED);
    }
    const {orderItems, subtotal:currentSubtotal} =await pricingServices.calculateCartSubtotal(userId);
    if(Math.round(currentSubtotal*100)!==Math.round(subtotal*100)){
        throw new Error(MESSAGES.CART_CHANGED);
    } 
    if(appliedCouponCode){
        const currentCoupon = await couponServices.validateCoupon(appliedCouponCode,currentSubtotal);
        if(Math.round(currentCoupon.discount*100)!==Math.round(couponDiscount*100)){
            throw new Error('Coupon pricing has changed');
        }
    }
    for(const item of  cart.items){
        if(item.variantId){
            const updatedVariant = await ProductVariant.findOneAndUpdate(
                {
                    _id:item.variantId,
                    productId:item.productId,
                    isActive:true,
                    stock:{$gte:item.quantity}
                },{
                    $inc:{stock:-item.quantity}
                },{new:true}
            );
            if(!updatedVariant){
                throw new Error(MESSAGES.STOCK_CHANGED);
            }
        }else{
            const updatedProduct = await Product.findOneAndUpdate(
                {
                    _id:item.productId,
                    isListed:true,
                    isDeleted:false,
                    stockLevel:{$gte:item.quantity}
                },{
                    $inc:{stockLevel:-item.quantity}
                },{new:true}
            );
            if(!updatedProduct){
                throw new Error(MESSAGES.STOCK_CHANGED);
            }
        }
    }
    const order = await Order.create({
        orderId:generateOrderId(),
        userId,
        items:orderItems,
        shippingAddress:{
            fullName:address.fullName,
            phone:address.phone,
            addressLine1:address.addressLine1,
            addressLine2:address.addressLine2,
            city:address.city,
            state:address.state,
            pincode:address.pincode
        },
        subtotal,
        couponId,
        couponCode:appliedCouponCode,
        couponDiscount,
        totalAmount,
        paymentMethod:'online',
        paymentStatus:'paid',
        orderStatus:'pending',
        razorpayOrderId,
        razorpayPaymentId
    });
    cart.items = [];
    await cart.save();
    return order;
}  

const createWalletOrder = async (userId, addressId,couponCode=null) => {
    const session = await mongoose.startSession();
    try {
        let createdOrder;

        await session.withTransaction(async () => {
            const cart = await Cart.findOne({ userId }).session(session);

            if (!cart || cart.items.length === 0) {
                throw new Error(MESSAGES.CART_EMPTY);
            }
            const address = await Address.findOne({
                _id: addressId,
                userId
            }).session(session);

            if (!address) {
                throw new Error(MESSAGES.DELIVERY_ADDRESS_NOT);
            }
            const {
            orderItems,
            subtotal,
            couponId,
            couponCode:appliedCouponCode,
            couponDiscount,
            totalAmount
            }= await getOrderPricing(userId, couponCode);
            for (const item of orderItems) {
                let result;

                if (item.variantId) {
                    result = await ProductVariant.updateOne(
                        {
                            _id: item.variantId,
                            productId: item.productId,
                            isActive: true,
                            stock: { $gte: item.quantity }
                        },
                        {
                            $inc: { stock: -item.quantity }
                        },
                        { session }
                    );
                } else {
                    result = await Product.updateOne(
                        {
                            _id: item.productId,
                            isListed: true,
                            isDeleted: false,
                            stockLevel: { $gte: item.quantity }
                        },
                        {
                            $inc: { stockLevel: -item.quantity }
                        },
                        { session }
                    );
                }

                if (result.matchedCount !== 1) {
                    throw new Error(MESSAGES.STOCK_CHANGED);
                }
            }
            await walletServices.changeWalletBalance({
                userId,
                type: 'debit',
                amount: totalAmount,
                description: 'Payment for BuildaPC order',
                referenceId: `wallet-payment-${generateOrderId()}`,
                session
            });

            const orders = await Order.create(
                [{
                    orderId: generateOrderId(),
                    userId,
                    items: orderItems,
                    shippingAddress: {
                        fullName: address.fullName,
                        phone: address.phone,
                        addressLine1: address.addressLine1,
                        addressLine2: address.addressLine2,
                        city: address.city,
                        state: address.state,
                        pincode: address.pincode
                    },
                    subtotal,
                    couponId,
                    couponCode:appliedCouponCode,
                    couponDiscount,
                    totalAmount,
                    paymentMethod: 'wallet',
                    paymentStatus: 'paid',
                    orderStatus: 'pending'
                }],
                { session }
            );
            createdOrder = orders[0];
            cart.items = [];
            await cart.save({ session });
        });
        return createdOrder;
    } finally {
        await session.endSession();
    }
};

const getOrderByOrderId = async(userId, orderId)=>{
        const order = await Order.findOne({userId, orderId}).lean();
        if(!order){
            throw new Error('Order not found');
        }
        return order;
}
const getUserOrders = async (userId) => {
    const orders = await Order.find({userId})
    .sort({ createdAt: -1 })
    .lean();
    return orders;
};
const cancelOrder = async(userId, orderId, cancellationReason = '')=>{
    const session = await mongoose.startSession();
    try{
        let updatedOrder;
        await session.withTransaction(async()=>{
            const order = await Order.findOne({userId,orderId}).session(session);
            if(!order){
                throw new Error(MESSAGES.ORDER_NOT_FOUND);
            }
            if(order.orderStatus!=='pending'){
                throw new Error('This order cannot be cancelled');
            }
            for(const item of order.items){
                let result;
                if(item.variantId){
                    result = await ProductVariant.updateOne(
                        {_id:item.variantId},
                        {$inc:{stock:item.quantity}},
                        {session}
                    );
                }else{
                    result = await Product.updateOne(
                        {_id:item.productId},
                        {$inc:{stockLevel:item.quantity}},
                        {session}
                    )
                }
                if(result.matchedCount !==1){
                    throw new Error(`Product not found: ${item.productName}`);
                }
            }
                if(order.paymentStatus==='paid'){
                    await walletServices.changeWalletBalance({
                        userId:order.userId,
                        type:'credit',
                        amount:order.totalAmount,
                        description:`Refund for cancelled order ${order.orderId}`,
                        session
                    });
                }
                order.orderStatus = 'cancelled';
                order.cancellationReason= cancellationReason.trim();
                order.cancelledAt=new Date();
                await order.save({session});

                updatedOrder = order;
        });
        return updatedOrder;
    }finally{
        await session.endSession();
    }
}
const cancelOrderItem = async(userId,orderId,itemId,cancellationReason)=>{
    const session = await mongoose.startSession();
    try{
        let updatedOrder;
        await session.withTransaction(async()=>{
            const order = await Order.findOne({
                userId,
                orderId
            }).session(session);
            if(!order){
                throw new Error(MESSAGES.ORDER_NOT_FOUND);
            }
            if(order.orderStatus !=='pending'){
                throw new Error('This item cannot be cancelled at this stage');
            }
            const item = order.items.id(itemId);
            if(!item){
                throw new Error('Order item not found');
            }
            if(item.itemStatus==='cancelled'){
                throw new Error('This item is already cancelled');
            }
            const itemTotal = Number((item.price*item.quantity).toFixed(2));
            if(itemTotal>order.subtotal){
                throw new Error('Invalid order item amount');
            }
            const currentSubtotal = Number(order.subtotal);
            const currentCouponDiscount = Number(order.couponDiscount||0);
            const itemCouponDiscount = currentSubtotal>0?Math.min(currentCouponDiscount,Number((currentCouponDiscount*itemTotal/currentSubtotal).toFixed(2))):0;
            const refundAmount = Number(Math.max(0,itemTotal-itemCouponDiscount).toFixed(2));
            let stockResult;
            if(item.variantId){
                stockResult = await ProductVariant.updateOne(
                    {_id:item.variantId},
                    {$inc:{stock:item.quantity}},
                    {session}
                );
            }else{
                stockResult = await Product.updateOne(
                    {_id:item.productId},
                    {$inc:{stockLevel:item.quantity}},
                    {session}
                );
            }
            if(stockResult.matchedCount !==1){
                throw new Error(`Product not found: ${item.productName}`);
            }
            if(order.paymentStatus==='paid' &&refundAmount>0){
                await walletServices.changeWalletBalance({
                    userId:order.userId,
                    type:'credit',
                    amount:refundAmount,
                    description:`Refund for ${item.productName} in order ${order.orderId}`,
                    session
                });
            }
            item.itemStatus = 'cancelled';
            item.cancellationReason=cancellationReason.trim();
            item.cancelledAt= new Date();
            order.subtotal = Number(Math.max(0,currentSubtotal-itemTotal).toFixed(2));
            order.couponDiscount = Number(Math.max(0,currentCouponDiscount-itemCouponDiscount).toFixed(2));
            order.totalAmount = Number(Math.max(0,Number(order.totalAmount)-refundAmount).toFixed(2));
            const allItemsCancelled = order.items.every(orderItem=>orderItem.itemStatus==='cancelled');
            if(allItemsCancelled){
                order.orderStatus = 'cancelled';
                order.cancellationReason = 'All item in the order were cancelled';
                order.cancelledAt = new Date();
            }
            await order.save({session});
            updatedOrder= order;
        });
        return updatedOrder;
    }finally{
        await session.endSession();
    }
};
const returnOrder = async (userId, orderId, returnReason) => {
    const order = await Order.findOne({userId,orderId});
    if (!order) {
        throw new Error('Order not found');
    }
    if (order.orderStatus !== 'delivered') {
        throw new Error(
            'Only delivered orders can be returned'
        );
    }
    if (!returnReason || !returnReason.trim()) {
        throw new Error(
            'Return reason is required'
        );
    }
    order.orderStatus = 'Return requested';
    order.returnReason = returnReason.trim();
    order.returnedAt = new Date();

    await order.save();
    await notificationServices.createNotification(
        MESSAGES.RETURN_REQUEST,
        `A customer has requsted a return request for order ${order.orderId}`
    )
    return order;
};
const getOrderDetails = async(userId, orderId)=>{
    const order = await Order.findOne({userId,orderId}).lean();
    if(!order){
        throw new Error('Order not found');
    }
    return order;
}
module.exports ={
    createOrder,
    createOnlinePayment,
    createPaidOnlineOrder,
    createWalletOrder,
    getOrderByOrderId,
    getUserOrders,
    cancelOrder,
    cancelOrderItem,
    returnOrder,
    getOrderDetails
}