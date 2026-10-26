const crypto = require('crypto');
const mongoose = require('mongoose');
const User = require('../../model/userSchema');
const Order = require('../../model/orderSchema');
const ReferralHistory = require('../../model/referralSchema');
const {changeWalletBalance} = require('../../services/user/walletServices');

const getReferralCode = async(userId)=>{
    const user = await User.findById(userId);
    if(!user){
        throw new Error('user not found');
    }
    if(user.referralCode){
        return user.referralCode;
    }
    let referralCode;
    let codeExists= true;
    while(codeExists){
        referralCode = crypto.randomBytes(5).toString('hex').toUpperCase();
        codeExists = await User.exists({referralCode});
    }
    user.referralCode = referralCode    ;
    await user.save();
    return referralCode;
}
const validateReferralCode = async(referralCode)=>{
    const code = referralCode.trim().toUpperCase();
    const referrer = await User.findOne({
        referralCode:code,
        isBlocked:false
    }).select('_id referralCode');
    if(!referrer){
        return {valid:false,message:'Invalid referral code'};
    }
    return {
        valid:true,
        referrerId:referrer._id,
        referralCode:referrer.referralCode
    };
};
const referralReward = async(orderId )=>{
    const dbSession = await mongoose.startSession();
    try{
        await dbSession.withTransaction(async()=>{
            const order = await Order.findById(orderId).session(dbSession);
            if(!order||order.orderStatus!=='delivered'){
                return;
            }
            const referral = await ReferralHistory.findOne({
                referredUserId:order.userId,
                status:'pending'
            }).session(dbSession);
            if(!referral){
                return;
            }
            const earlierDeliveredOrder = await Order.exists({
                userId:order.userId,
                orderStatus:'delivered',
                createdAt:{$lt:order.createdAt},
                _id:{$ne:order._id}
            }).session(dbSession);
            if(earlierDeliveredOrder){
                return;
            };
            await changeWalletBalance({
                userId:referral.referrerId,
                type:'credit',
                amount:500,
                description:'Referral reward',
                referenceId:`REFERRAL-${referral._id}-REFERRER`,
                session:dbSession
            });
            await changeWalletBalance({
                userId:referral.referredUserId,
                type:'credit',
                amount:500,
                description:'Welcome referral reward',
                referenceId:`REFERRAL-${referral._id}-REFERRED`,
                session:dbSession
            });
            referral.referrerRewarded=true;
            referral.referredUserRewarded=true;
            referral.status = 'rewarded';
            referral.rewardedAt= new Date();
            await referral.save({session:dbSession});
        });
    }finally{
        await dbSession.endSession();
    }
}
module.exports = {
    getReferralCode,
    validateReferralCode,
    referralReward
}