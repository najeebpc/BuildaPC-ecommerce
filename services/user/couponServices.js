const Coupon = require('../../model/couponSchema');
const MESSAGES =  require('../../constants/messages');

const getAvailableCoupons = async()=>{
    const now = new Date();
    return await Coupon.find({
        isActive:true,
        startDate:{$lte:now},
        expiryDate:{$gte:now},
        $expr:{
            $lt:['$usedCount','$usageLimit']
        }
    }).sort({createdAt:-1});
}
const validateCoupon = async(code,orderAmount)=>{
    if(!code){
        throw new Error(MESSAGES.ENTER_COUPEN_CODE);
    }
    if(!Number.isFinite(orderAmount)||orderAmount<0){
        throw new Error('Invalid order amount');
    }
    const coupon = await Coupon.findOne({
        code:code.trim().toUpperCase()
    });
    if(!coupon||!coupon.isActive){
        throw new Error(MESSAGES.COUPON_NOT_FOUND);
    }
    const now = new Date();
    if(now<coupon.startDate){
        throw new Error(MESSAGES.COUPON_NOT_STARTED);
    }
    if(now>coupon.expiryDate){
        throw new Error(MESSAGES.COUPON_EXPIRED);
    }
    if(coupon.usedCount>=coupon.usageLimit){
        throw new Error(MESSAGES.COUPON_USAGE_LIMIT_REACHED);
    }
    if(orderAmount<coupon.minOrderAmount){
        throw new Error(
            `Minimum order amount is ${coupon.minOrderAmount.toLocaleString('en-IN')}.`
        );
    }
    let discount = 0;
    if(coupon.discountType==='percentage'){
        discount= orderAmount*coupon.discountValue/100;
        if(coupon.maxDiscount !=null){
            discount = Math.min(discount, coupon.maxDiscount);
        }
    }else{
        discount = coupon.discountValue;
    }
    discount = Math.min(discount, orderAmount);
    discount = Math.round(discount*100)/100;
    
    return {
        couponId:coupon._id,
        code:coupon.code,
        discount,
        orderAmount,
        payableAmount:Math.round((orderAmount-discount)*100)/100
    };
};

module.exports = {
    getAvailableCoupons,
    validateCoupon
}