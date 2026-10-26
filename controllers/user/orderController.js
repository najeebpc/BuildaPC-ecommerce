const orderServices = require('../../services/user/orderServices');
const incoiceServices = require('../../services/user/invoiceServices');
const paymentServices = require('../../services/user/paymentServices');
const crypto = require('crypto');
const MESSAGES = require('../../constants/messages');
const placeOrder = async(req,res)=>{
    try{
        const userId = req.session.user._id;
        const {addressId, paymentMethod} = req.body;
        if(!addressId){
            return res.status(400).json({
                success:false,
                message:'Delivery address is required'
            })
        }
        if(!['cod','wallet'].includes(paymentMethod)){
            return res.status(400).json({
                success:false,
                message:'Payment method is required'
            })
        }
        let order;
        if(paymentMethod ==='cod'){
            order = await orderServices.createOrder(userId, addressId, 'cod',req.session.appliedCoupon?.code||null);
        }else if(paymentMethod==='wallet'){
            order = await orderServices.createWalletOrder(userId, addressId,req.session.appliedCoupon?.code||null);
        }
        delete req.session.appliedCoupon;
        return res.status(200).json({
            success:true,
            message:'Order placed successfully',
            orderId:order.orderId
        })
    }catch(error){
        console.log("place order error ", error);
        return res.status(400).json({
            success:false,
            message:error.message
        })
    }
};
const createOnlinePayment = async(req,res)=>{
    try{
    const userId = req.session.user._id;
    const {addressId} = req.body;
    if(!addressId){
        return res.status(400).json({
            success:false,
            message:MESSAGES.DELIVERY_ADDRESS_NOT
        });
    }
    const paymentOrder = await orderServices.createOnlinePayment(userId,addressId, req.session.appliedCoupon?.code||null);
    return res.status(200).json({
        success:true,
        key:process.env.RAZORPAY_KEY_ID,
        ...paymentOrder
    })
    }catch(error){
        console.log('Create online payment order :',error);
        return res.status(400).json({
            success:false,
            message:error.message
        })
    }
}
const verifyOnlinePayment = async(req,res)=>{
    try{
        const userId = req.session.user._id;
        const {
            addressId,
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        }=req.body;
        if(
            !addressId||
            !razorpay_order_id||
            !razorpay_payment_id||
            !razorpay_signature
        ){
            return res.status(400).json({
                success:false,
                message:MESSAGES.PAYMENT_DETAILS_MISS
            })
        }
        const expectedSignature = crypto
        .createHmac(
            'sha256',
            process.env.RAZORPAY_KEY_SECRET
        )
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');
    const exptectedBuffer = Buffer.from(expectedSignature);
    const receivedBuffer = Buffer.from(razorpay_signature);
    if(
        exptectedBuffer.length !== receivedBuffer.length||
        !crypto.timingSafeEqual(exptectedBuffer, receivedBuffer)
    ){
        return res.status(400).json({
            success:false,
            message:MESSAGES.PAYMENT_SIGNATURE_FAILED
        });
    }
    const order = await orderServices.createPaidOnlineOrder(
        userId,
        addressId,
        razorpay_order_id,
        razorpay_payment_id
    );
    delete req.session.appliedCoupon;
    return res.status(200).json({
        success:true,
        message:MESSAGES.PAYMENT_SUCCESSFUL,
        orderId:order.orderId
    })
    }catch(error){
        console.log('verify online payment error',error);
        return res.status(400).json({
            success:false,
            message:error.message
        })
    }
}
const loadOrderSuccess = async(req,res)=>{
    try{
        const userId = req.session.user._id;
        const user = req.session.user;
        const orderId  =req.params.orderId;
        const order = await orderServices.getOrderByOrderId(userId,orderId);
        return res.render('user/order-success',{
            order,
            user
        })
    }catch(error){
        console.log('Load order success error',error);
        return res.redirect('/');
    }
};
const loadOrders = async (req, res) => {
    try {
        const userId = req.session.user._id;
        const user = req.session.user
        const orders =await orderServices.getUserOrders(userId);
        return res.render('user/orders',
            {
                orders,
                user
            }
        );
    } catch (error) {
        console.log('Load orders error:',error );
        return res.redirect('/account');
    }
};
const cancelOrder = async (req, res) => {
    try {
        const userId = req.session.user._id;
        const orderId = req.params.orderId;
        const { cancellationReason} = req.body;
        await orderServices.cancelOrder(
            userId,
            orderId,
            cancellationReason || ''
        );
        return res.status(200).json({
            success: true,
            message: 'Order cancelled successfully'
        });
    } catch (error) {
        console.log('Cancel order error:',error );
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};
const cancelOrderItem = async(req,res)=>{
    try{
        const userId = req.session.user._id;
        const {orderId,itemId} = req.params;
        const {cancellationReason} = req.body;
        const updatedOrder = await orderServices.cancelOrderItem(userId,orderId,itemId,cancellationReason);
        return res.status(200).json({
            success:true,
            message:'Item cancelled successfully',
            orderStatus: updatedOrder.orderStatus
        });
    }catch(error){
        console.log('cancel order item error',error);
        return res.status(400).json({
            success:false,
            message:error.message||'Unable to cancel item'
        })
    }
};
const returnOrder = async (req, res) => {
    try {
        const userId = req.session.user._id;
        const orderId = req.params.orderId
        const { returnReason } = req.body;
        if (!returnReason || !returnReason.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Return reason is required'
            });
        }
        await orderServices.returnOrder(
            userId,
            orderId,
            returnReason
        );
        return res.status(200).json({
            success: true,
            message: 'Order return requested'
        });
    } catch (error) {
        console.log('Return order error:', error);
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};
const loadOrderDetails = async(req,res)=>{
    try{
    const userId = req.session.user._id;
    const user = req.session.user;
    const orderId = req.params.orderId;

    const order = await orderServices.getOrderDetails(userId,orderId);
    return res.render('user/order-details',{
        order,
        user
     })
    }catch(error){
        console.log('Failed to load order',error);
        return res.redirect('account/orders')
    } 
}
const downloadInvoice = async(req,res)=>{
    try{
        const userId = req.session.user._id;
        const orderId = req.params.orderId;
        await incoiceServices.generateInvoice(userId, orderId, res);
    }catch(error ){
        console.log('Download invoice error',error);

    }
} 
module.exports = {
    placeOrder,
    createOnlinePayment,
    verifyOnlinePayment,
    loadOrderSuccess,
    loadOrders,
    cancelOrder,
    cancelOrderItem,
    returnOrder,
    loadOrderDetails,
    downloadInvoice
}