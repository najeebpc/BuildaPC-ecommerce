const Coupon = require('../../model/couponSchema')  ;
const MESSAGES = require('../../constants/messages');
const createCoupon = async(couponData)=>{
    const {
        code,
        discountType,
        discountValue,
        minOrderAmount,
        maxDiscount,
        startDate,
        expiryDate,
        usageLimit,
        perUserLimit
    }= couponData;
    const couponCode = code.trim().toUpperCase();
    const existingCoupon = await Coupon.findOne({code:couponCode});
    if(existingCoupon){
        throw new Error(MESSAGES.COUPON_CODE_EXISTS);
    }
    if(!['percentage','fixed'].includes(discountType)){
        throw new Error(MESSAGES.COUPON_DISCOUNT_TYPE_INVALID);
    }
    if(!Number.isFinite(Number(discountValue))||Number(discountValue)<=0){
        throw new Error(MESSAGES.COUPON_DISCOUNT_VALUE_INVALID)
    }
    
    if(discountType==='percentage' && Number(discountValue)>100){
        throw new Error(MESSAGES.COUPON_PERCENTAGE_INVALID)
    }
    if(discountType==='fixed' && Number(minOrderAmount)<=Number(discountValue)){
        throw new Error(MESSAGES.COUPON_DISCOUNT_VALUE_LESSTHAN_MIN_ORDER);
    }
    if(
        discountType==='percentage'&&
        maxDiscount !=null &&
        maxDiscount !=''&&
        (!Number.isFinite(Number(maxDiscount))||Number(maxDiscount)<=0)
    ){
        throw new Error(MESSAGES.COUPON_MAX_DISCOUNT_INVALID)
    }
    const start = new Date(`${startDate}T00:00:00+05:30`);
    const expiry = new Date(`${expiryDate}T23:59:59.999+05:30`);
    if(!startDate||!expiryDate||Number.isNaN(start.getTime())||Number.isNaN(expiry.getTime())||expiry<=start){
        throw new Error(MESSAGES.COUPON_EXPIRY_INVALID);
    }
    if(!Number.isFinite(Number(minOrderAmount))||Number(minOrderAmount)<0){
        throw new Error(MESSAGES.COUPON_MINAMOUNT_INVALID);
    }
    if(!Number.isInteger(Number(usageLimit))||Number(usageLimit)<1){
        throw new Error(MESSAGES.COUPON_USAGELIMIT_INVALID);
    }
    const userLimit = perUserLimit===''||perUserLimit===null?1 :Number(perUserLimit);
    if(!Number.isInteger(userLimit)||userLimit<1){
        throw new Error(MESSAGES.COUPON_PERUSERLIMIT_INVALID)
    }
    console.log('usageLimit in service',usageLimit);
    const coupon = new Coupon({
        code:couponCode,
        discountType,
        discountValue:Number(discountValue),
        minOrderAmount:Number(minOrderAmount),
        maxDiscount: discountType==='percentage'&& maxDiscount !=null &&
                        maxDiscount !==''
                        ?Number(maxDiscount):null,
        startDate:start,
        expiryDate:expiry,
        usageLimit:Number(usageLimit),
        perUserLimit:userLimit
    });

    return await coupon.save();
};
const getAllCoupons = async()=>{
    return await Coupon.find().sort({createdAt:1});
};
const getCouponById = async(couponId)=>{
    const coupon = await Coupon.findById(couponId);
    if(!coupon){
        throw new Error(MESSAGES.COUPON_NOT_FOUND);
    }
    return coupon;
};
const updateCouponStatus = async(couponId, isActive)=>{
    const coupon = await Coupon.findById(couponId);
    if(!coupon){
        throw new Error(MESSAGES.COUPON_NOT_FOUND);
    }
    coupon.isActive = isActive;
    return await coupon.save();
}
const deleteCoupon = async(couponId)=>{
    const coupon = await Coupon.findByIdAndDelete(couponId);
    if(!coupon){
        throw new Error(MESSAGES.COUPON_NOT_FOUND)
    }
    return coupon;
};
module.exports = {
    createCoupon,
    getAllCoupons,
    getCouponById,
    updateCouponStatus,
    deleteCoupon
}