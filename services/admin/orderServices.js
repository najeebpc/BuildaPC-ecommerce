const Order = require('../../model/orderSchema');
const User = require('../../model/userSchema');
const mongoose = require('mongoose');
const Product = require('../../model/productSchema');
const ProductVariant = require('../../model/variantSchema');
const MESSAGES = require('../../constants/messages');
const walletServices = require('../../services/user/walletServices');
const referralServices = require('../../services/user/referralServices');
const getAllOrders = async ({
    search = '',
    status = '',
    sort = 'newest',
    page = 1 }) => {
    const limit = 10;
    const skip = (page - 1) * limit;
    const query = {};
    if (search) {
        const users = await User.find({
            name: {
                $regex: search,
                $options: 'i'
            }
        }).select('_id');
        const userIds = users.map(user => user._id);
        query.$or = [
            {
                orderId: {
                    $regex: search,
                    $options: 'i'
                }
            },
            {
                userId: {
                    $in: userIds
                }
            }
        ];
    }
    if (status) {
        query.orderStatus = status;
    }
    const sortOption =
        sort === 'oldest'
            ? { createdAt: 1 }
            : { createdAt: -1 };
    const totalOrders =   await Order.countDocuments(query);

    const orders = await Order.find(query)
            .populate(
                'userId',
                'name email')
            .sort(sortOption)
            .skip(skip)
            .limit(limit)
            .lean();
    const totalPages =  Math.ceil(totalOrders / limit);
    return {
        orders,
        currentPage: page,
        totalPages
    };
};
const updateOrderStatus = async (orderId,orderStatus) => {
    const allowedStatuses = [
        'pending',
        'shipped',
        'out for delivery',
        'delivered',
        'cancelled'
        
    ];
    if (!allowedStatuses.includes(orderStatus)) {
        throw new Error('Invalid order status');
    }
    const session = await mongoose.startSession();
    try{
        let order;
        await session.withTransaction(async()=>{
            order = await Order.findOne({orderId}).session(session);
            if(!order){
                throw new Error('Order not found');
            }
            if(orderStatus==='cancelled'){
                if(order.orderStatus==='cancelled'){
                    throw new Error('Order is already cancelled');
                }
                for(const item of order.items){
                    if(['cancelled','returned'].includes(item.itemStatus)){
                        continue;
                    }
                    const result = item.variantId
                        ?await ProductVariant.updateOne(
                            {_id:item.variantId},
                            {$inc:{stock:item.quantity}},
                            {session}
                        )
                        :await Product.updateOne(
                            {_id:item.productId},
                            {$inc:{stockLevel:item.quantity}},
                            {session}
                        );
                        if(result.matchedCount !==1){
                            throw new Error(`Product not found: ${item.productName}`);
                        }
                        item.itemStatus = 'cancelled';
                        item.cancelledAt= new Date();
                }
                if(order.paymentStatus ==='paid'&&Number(order.totalAmount)>0){
                    await walletServices.changeWalletBalance({
                        userId:order.userId,
                        type:'credit',
                        amount:Number(order.totalAmount),
                        description:`Refund for cancelled order ${order.orderId}`,
                        session
                    });
                }
            }
            order.orderStatus = orderStatus;
            await order.save({session});
        });
    if(order.orderStatus==='delivered'){
        await referralServices.referralReward(order._id)
    }
    return order;
    }finally{
        await session.endSession();
    }
};
const getOrderDetails = async (orderId) => {
    const order = await Order.findOne({ orderId })
            .populate('userId','name email')
            .lean();
    if (!order) {
        throw new Error('Order not found');
    }
    return order;
};

const reviewReturnRequest = async(orderId,decision)=>{
    const allowedDecisions = ['approved','rejected'];
    if(!allowedDecisions.includes(decision)){
        throw new Error(MESSAGES.INVALID_DECISION);
    }
    const order = await Order.findOne({orderId});
    if(!order){
        throw new Error(MESSAGES.ORDER_NOT_FOUND);
    }
    if(order.orderStatus!=='Return requested'){
        throw new Error(MESSAGES.DONT_HAVE_ORDER_REQUEST);
    }
    if(decision==='approved'){
        order.orderStatus ='Return approved';
    }else{
        order.orderStatus='Return rejected';
    }
    await order.save();
    return order;
}
const markReturnReceived = async(orderId)=>{
    const session = await mongoose.startSession();
    try{
        let updatedOrder;
        await session.withTransaction(async()=>{
            const order = await Order.findOne({orderId})
            .session(session);
            if(!order){
                throw new Error(MESSAGES.ORDER_NOT_FOUND);
            }
            if(order.orderStatus!=='Return approved'){
                throw new Error('Only approved return can be marked as received');
            }
            if(order.returnStockRestored){
                throw new Error('Stock has already been restored for this return');
            }
            for(const item of order.items){
                if(['cancelled','returned'].includes(item.itemStatus)){
                    continue;
                }
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
                    );
                }
                if(order.paymentStatus==='paid'){
                    await walletServices.changeWalletBalance({
                        userId:order.userId,
                        type:'credit',
                        amount:order.totalAmount,
                        description:`Refund for returned order ${order.orderId}`,
                        session
                    }); 
                }
                if(result.matchedCount!==1){
                    throw new Error(`Product not found: ${item.productName}`);
                }

            }
            order.orderStatus='Return received';
            order.returnStockRestored=true;
            order.returnReceivedAt= new Date();
            await order.save({session});
            updatedOrder =order;
        });
        return updatedOrder;
    }finally{
        await session.endSession();
    }
}
module.exports = {
    getAllOrders,
    updateOrderStatus,
    getOrderDetails,
    reviewReturnRequest,
    markReturnReceived
};