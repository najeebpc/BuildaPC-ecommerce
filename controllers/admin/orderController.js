
const orderServices = require('../../services/admin/orderServices');
const MESSAGES = require('../../constants/messages');


const loadOrders = async (req, res) => {

    try {
        const admin = req.session.admin;
        const search = req.query.search || '';
        const status = req.query.status || '';
        const sort = req.query.sort || 'newest';
        const page =parseInt(req.query.page) || 1;
        const result =
            await orderServices.getAllOrders({
                search,
                status,
                sort,
                page
            });
        return res.render(
            'admin/orders',
            {
                orders: result.orders,
                currentPage:result.currentPage,
                totalPages: result.totalPages,
                search,
                status,
                sort,
                admin
            }
        );
    } catch (error) {
        console.log('Load admin orders error:', error);
        return res.status(500).send('Something went wrong');
    }
};
const updateOrderStatus = async(req,res)=>{
    try{
        const orderId = req.params.orderId;
        const {orderStatus} =req.body;
        await orderServices.updateOrderStatus(orderId,orderStatus);
        return res.status(200).json({
            success:true,
            message:'Order status updated successfully'
        })
    }catch(error){
        console.log('update order status error',error);
        return res.status(400).json({
            success:false,
            message:error.message
        })
    }
}
const loadOrderDetails = async(req,res)=>{
    try{
        const orderId = req.params.orderId;
        const order = await orderServices.getOrderDetails(orderId);
        return res.render('admin/order-details',{
            order
        })
    }catch(error){
        console.log('Load order detail error',error);
        return res.redirect('/admin/orders')
    }
}
const reviewReturnRequest = async(req,res)=>{
    try{
        const {orderId,itemId} = req.params;
        const {decision} = req.body;
        await orderServices.reviewReturnRequest(orderId,itemId,decision);
        return res.status(200).json({
            success:true,
            message:decision==='approved'
            ?MESSAGES.RETURN_APPROVED
            :MESSAGES.RETURN_REJECTED
        });
    }catch(error){
        console.log('review return error', error);
        return res.status(400).json({
            success:false,
            message:error.message
        });
    }
}
const markReturnReceived = async(req,res)=>{
    try{
        const {orderId,itemId} = req.params;
        await orderServices.markReturnReceived(orderId,itemId);
        return res.status(200).json({
            success:true,
            message:MESSAGES.RETURN_RECEIVED
        });
    }catch(error){
        console.log('return receive error', error);
        return res.status(400).json({
            success:false,
            message:error.message
        })
    }
}
module.exports = {
    loadOrders,
    updateOrderStatus,
    loadOrderDetails,
    reviewReturnRequest,
    markReturnReceived
}