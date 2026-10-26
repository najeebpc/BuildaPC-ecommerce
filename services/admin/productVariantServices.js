const Product = require('../../model/productSchema');
const { create } = require('../../model/userSchema');
const ProductVariant = require('../../model/variantSchema');

const getProductVariantData = async(productId)=>{
    const product = await Product.findById(productId)
        .populate('categoryId').lean();
    
    const variantAttributes = product.categoryId?.variantAttributes||[];
    const variants = await ProductVariant.find({
        productId:productId
    }).lean();
    return {
        product,
        variantAttributes,
        variants
    }
};
const createVariant  = async(productId, variantData)=>{
    const variant = await ProductVariant.create({
        productId,
        attributes:variantData.attributes,
        price:variantData.price,
        stock:variantData.stock,
        isActive:variantData.isActive
    });
    return variant;
}
const updateVariant = async(productid, variantId, variantData)=>{
    const variant = await ProductVariant.findOneAndUpdate(
        {
        _id:variantId,
        productId:productid
        },
        {
            attributes:variantData.attributes,
            price:variantData.price,
            stock:variantData.stock,
            isActive:variantData.isActive
        },
        {
            new:true,
            runValidators:true
        }
    )
    if(!variant){
    throw new Error('Variant not found')
    }
    return variant;
}
const deleteVariant = async(productId, variantId)=>{
    const variant = await ProductVariant.findOneAndDelete({
        _id:variantId,
        productId:productId
    });
    if(!variant){
        throw new Error('Variant not found');
    }
    return variant;
}
const countActiveVariants  = async(productId)=>{
    return ProductVariant.countDocuments({productId,isActive:true})
}
module.exports ={
    getProductVariantData,
    createVariant,
    updateVariant,
    deleteVariant,
    countActiveVariants
}
