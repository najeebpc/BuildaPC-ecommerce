const couponServices = require('../../services/user/couponServices');

const loadAvailableCoupon = async(req,res)  =>{
    try{
        const coupons = await couponServices.getAvailableCoupons();
        res.render('user/coupons',{
            coupons,
            user:req.session.user
        })
    }catch(error){
        console.log('load coupon error',error);
        res.status(500);
    }
}
module.exports = {
    loadAvailableCoupon
}