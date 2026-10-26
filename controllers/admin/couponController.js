const couponServices = require('../../services/admin/couponServices');
const MESSAGES = require('../../constants/messages');

const loadCoupons = async(req,res)=>{
    try{
        const coupons = await couponServices.getAllCoupons();
        const admin = req.session.admin;
        res.render('admin/coupons',{
            coupons,
            admin
        })
    }catch(error){
        console.log('error loadin coupons',error);
        res.redirect('/admin/dashboard');
    }
};
const addCoupon = async(req,res)=>{
    try{
        console.log('formdata req bofy',req.body);
        console.log('form data usage limit ', req.body.usageLimit);
        await couponServices.createCoupon(req.body);
        return res.status(200).json({
            success:true,
            message:MESSAGES.COUPON_CREATED
        });
    }catch(error){
        console.log('error creating coupon',error);
        return res.status(400).json({
            success:false,
            message:error.message
        });
    }
};
const updateCouponStatus = async(req,res)=>{
    try{
        const {isActive} = req.body;
        const couponId = req.params.id;
        if(typeof isActive !== 'boolean'){
            return res.status(400).json({
                success:false,
                message:MESSAGES.COUPON_STATUS_INVALID
            });
        }
        const result = await couponServices.updateCouponStatus(couponId,isActive);
        return res.status(200).json({
            success:true,
            message:result.isActive
                ?MESSAGES.COUPON_ACTIVATED
                :MESSAGES.COUPON_DISABLED
        });
    }catch(error){
        return res.status(400).json({
            success:false,
            message:error.message
        })
    }
}
const removeCoupon = async(req,res)=>{
    try{
        await couponServices.deleteCoupon(req.params.id);
        return res.status(200).json({
            success:true,
            message:MESSAGES.COUPON_DELETED
        });
    }catch(error){
        console.log('error deleting coupon',error);
        return res.status(400).json({
            success:false,
            message:error.message
        })
    }
};
module.exports ={
    loadCoupons,
    addCoupon,
    removeCoupon,
    updateCouponStatus
}