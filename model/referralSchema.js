const mongoose = require('mongoose');

const referralHistorySchema = new mongoose.Schema({
    referrerId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    referredUserId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true,
        unique:true
    },
    status:{
        type:String,
        enum:['pending','rewarded'],
        default:'pending'
    },
    referrerRewarded:{
        type:Boolean,
        default:false
    },
    referredUserRewarded:{
        type:Boolean,
        default:false
    },
    rewardedAt:{
        type:Date,
        default:null
    }
},{timestamps:true});
module.exports= mongoose.model('ReferralHistory',referralHistorySchema);