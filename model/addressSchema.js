const mongoose = require("mongoose");
const {Schema} = mongoose;
const addressSchema = new Schema({
    userId:{
        type:Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    fullName:{
        type:String,
        required:true
    },
    phone: {
        type: String, required: true, trim: true 
    },

    addressLine1: { 
        type: String, required: true, trim: true 
    },
    addressLine2: { 
        type: String, trim: true, default: '' 
    },
    city: { 
        type: String, required: true, trim: true 
    },
    state: { 
        type: String, required: true, trim: true 
    },
    pincode: { 
        type: String, required: true, trim: true 
    },
    isDefault: { 
        type: Boolean, default: false 
    },
    
},{
    timestamps: { 
        createdAt: 'created_at', 
        updatedAt: 'updated_at' 
    }
})
const Address = mongoose.model("Address",addressSchema);
module.exports = Address;