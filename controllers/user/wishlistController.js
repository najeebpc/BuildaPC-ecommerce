const userServices = require("../../services/user/userServices");
const wishlistServices = require('../../services/user/wishlistServices');
const MESSAGES = require('../../constants/messages');
const { json } = require("express");

const loadWhishlist = async(req,res)=>{
    try{
        const userId = req.session.user;
        const user = await userServices.findUserById(userId);
        const products = await wishlistServices.getWishlist(userId);
        console.log('producst',products)
        res.render('user/wishlist',{
            user,
            products
        }
            
        )
    }catch(error){
        console.log(error);
        return res.status(500).send('failed to load wishlist');
    }
    
}
const addToWishlist = async(req, res)=>{
    try{
        const userId = req.session.user;
        const {productId,variantId,fromCart} = req.body;
        await wishlistServices.addToWishlist(userId, productId, variantId,fromCart===true);

        return res.status(200).json({
            success:true,
            message:MESSAGES.WISHLIST_ADDED
        });
    }catch(error){
        console.log('add wishlist error',error);
        return res.status(500).json({
            success:false,
            message:error.message
        })
    }
}
const removeFromWishlist = async(req,res)=>{
    try{
    const userId = req.session.user._id;
    const productId = req.params.id;
    const {variantId} = req.body;
    await wishlistServices.removeFromWishlist(userId, productId, variantId||null);
    return res.status(200).json({
        success:true,
        message:MESSAGES.WISHLIST_REMOVED
    })
}catch(error){
    console.log('remove error ',error);
    return res.status(500).json({
        success:false,
        message:error.message
    })
}
}
const removeProductIfExists = async(req,res)=>{
    try{
        const userId = req.session.user._id;
        const productId = req.params.id;
        const result= await wishlistServices.removeProductIfExists(userId,productId);
        return res.status(200).json({
            success:true,
            removed:result.removed
        })
    }catch(error){
        console.log('remove product form wishlist error',error);
        return res.status(500).json({
            success:false,
            message:error.message
        })
    }
}
module.exports = {
    loadWhishlist,
    addToWishlist,
    removeFromWishlist,
    removeProductIfExists
}