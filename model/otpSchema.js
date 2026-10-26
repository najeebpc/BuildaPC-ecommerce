const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
    email:{
        type:String,
        required:true,
        lowercase:true,
        trim:true
    },
    otp:{
        type:String,
        required:true
    },
    purpose:{
        type:String,
        required:true,
        enum:["SIGNUP","RESET-PASSWORD","CHANGE-EMAIL"]
    },
    expiresAt:{
        type: Date,
        required: true
    }
},{timestamps:true});
otpSchema.index(
    {expiresAt:1},
    {expireAfterSeconds:0}
)
module.exports= mongoose.model("Otp",otpSchema);