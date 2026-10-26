const addressServices = require('../../services/user/addressServices');
const cartServices = require('../../services/user/cartServices');
const walletServices = require('../../services/user/walletServices');
const couponServices = require('../../services/user/couponServices');
const pricingServices =require('../../services/user/pricingServices');
const MESSAGES = require('../../constants/messages');

const loadCheckout = async(req,res)=>{
    try{
        const userId = req.session.user._id;
        const user = req.session.user;
        const addresses = await addressServices.getUserAddress(userId);
        const items = await cartServices.getCart(userId);
        if(!items||items.length===0){
            return res.redirect('/cart');
        }
        const defaultAddress = addresses.find(address=>address.isDefault)||addresses[0];
        const {subtotal} = await pricingServices.calculateCartSubtotal(userId)
        let appliedCoupon = null;
        if(req.session.appliedCoupon){
            try{
                appliedCoupon = await couponServices.validateCoupon(
                    req.session.appliedCoupon.code,subtotal
                );
            }catch(error){
                delete req.session.appliedCoupn;
            }
        }
        res.render('user/checkout',{
            user,
            addresses,
            selectedAddress:defaultAddress,
            items,
            appliedCoupon
        })
    }catch(error){
        console.log('load checkout error',error);
        return res.redirect('/cart');
    }
}
const validateCheckout = async(req,res)=>{
    try{
        const userId = req.session.user;
        await cartServices.validateCartForCheckout(userId);
        await pricingServices.calculateCartSubtotal(userId);
        return res.status(200).json({
            success:true
        })
    }catch(error){
        console.log('validate error', error)
        return res.status(400).json({
            success:false,
            message:error.message
        })
    }
}
const loadPayment = async(req,res)=>{
    try{
        const userId = req.session.user._id;
        const user = req.session.user;
        const addressId = req.query.addressId;
        if(!addressId){
            return res.redirect('/checkout');
        }
        const addresses = await addressServices.getUserAddress(userId);
        const selectedAddress = addresses.find(address=>String(address._id)=== String(addressId));
        if(!selectedAddress){
            return res.redirect('/checkout');
        }
        const wallet = await walletServices.getOrCreateWallet(userId)
        const items = await cartServices.getCart(userId);
        if(!items||items.length===0){
            return res.redirect('/cart');
        }
        const {subtotal,origignalSubtotal,totalOfferDiscount} = await pricingServices.calculateCartSubtotal(userId);
        let appliedCoupon = null;
        let discount= 0 ;
        console.log('coupon in session',req.session.appliedCoupon);
        if(req.session.appliedCoupon?.code){
            try{
                appliedCoupon= await couponServices.validateCoupon(req.session.appliedCoupon.code, subtotal);
                discount= appliedCoupon.discount;
            }catch(error){
                delete req.session.appliedCoupon;
            }
        }
        const totalItems = items.reduce((total,item)=>total+item.quantity,0);
        const totalAmount = Math.round((subtotal-discount)*100)/100;
        res.render('user/payment',{
            selectedAddress,
            items,
            walletBalance:wallet.balance,
            user,
            subtotal,
            discount,
            totalItems,
            totalAmount,
            appliedCoupon
        });
    }catch(error){
        console.log('Load payment error',error);
        return res.redirect('/checkout');
    }
}
const applyCoupon = async(req,res)=>{
    try{
        const userId=req.session.user._id;
        const {code} = req.body;
        await cartServices.validateCartForCheckout(userId);
        const items = await cartServices.getCart(userId);
        if(!items||items.length===0){
            return res.status(400).json({
                success:false,
                message:MESSAGES.CART_NOT_FOUND
            });
        }
        const {subtotal} = await pricingServices.calculateCartSubtotal(userId);
        const coupon = await couponServices.validateCoupon(code, subtotal);
        req.session.appliedCoupon = {
            couponId:String(coupon.couponId),
            code:coupon.code
        }
        return res.status(200).json({
            success:true,
            message:MESSAGES.COUPON_APPLIED,
            coupon:{
                couponId:coupon.couponId,
                code:coupon.code,
                discount:coupon.discount,
                orderAmount:coupon.orderAmount,
                payableAmount:coupon.payableAmount
            }
        });
    }catch(error){
        console.log('apply coupon error',error);
        return res.status(400).json({
            success:false,
            message:error.message
        });
    }
};
const removeCoupon = async(req,res)=>{
    delete req.session.appliedCoupon;
    console.log('coupon removed');
    return res.status(200).json({
        success:true,
        message:MESSAGES.COUPON_REMOVED
    });;
}
module.exports ={
    loadCheckout,
    validateCheckout,
    loadPayment,
    applyCoupon,
    removeCoupon
}