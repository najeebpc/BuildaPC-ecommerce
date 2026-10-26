const cartServices = require('../../services/user/cartServices');
const userServices = require('../../services/user/userServices');
const MESSAGES = require('../../constants/messages');

const loadCart = async(req,res)=>{
    try{
        const user = req.session.user;
        const items = await cartServices.getCart(user._id);
        return res.render('user/cart',{
            user,
            items
        })
    }catch(error){
        console.log('loadcart error',error)
        return res.send('failed to load cart');
    }
}
const addtoCart = async(req,res)=>{
    try{
        const userId = req.session.user._id;
        console.log('user id',userId)
        const {productId,variantId,quantity} = req.body;
        console.log('cart requst body',req.body);
        await cartServices.addToCart(userId, productId,variantId||null,Number(quantity));
        return res.status(200).json({
            success:true,
            message:MESSAGES.ADDED_TO_CART
        })
    }catch(error){
        console.log('failed to add product',error);
        return res.status(500).json({
            success:false,
            message:error.message
        })
    }
}
const removeFromCart = async(req,res)=>{
    try{
        const userId = req.session.user._id;
        const cartItemId = req.params.id;
        await cartServices.removeFromCart(userId, cartItemId);
        return res.status(200).json({
            success:true,
            message:MESSAGES.CART_ITEM_REMOVED
        })
    }catch(error){
        console.log('Remove form cart erro ',error);
        return res.status(500).json({
            success:false,
            message:error.message
        })
    }
}
const updateCartQuantity = async(req,res)=>{
    try{
        const userId = req.session.user._id;
        const cartItemId = req.params.id;
        const {quantity} = req.body;
        await cartServices.updateCartQuantity(userId,cartItemId,quantity);
        return res.status(200).json({
            success:true,
            message:MESSAGES.QUANTITY_UPDATED
        })
    }catch(error){
        console.log('validate error', error)
        return res.status(400).json({
            success:false,
            message:error.message
        })
    }
}
module.exports={
    loadCart,
    addtoCart,
    removeFromCart,
    updateCartQuantity
}