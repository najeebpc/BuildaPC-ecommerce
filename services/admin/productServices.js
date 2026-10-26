const Product = require('../../model/productSchema');
const productVariant = require('../../model/variantSchema');
const Category = require('../../model/categorySchema');

const getAllProducts = async({search, page})=>{
    const limit = 10;
    const skip = (page-1)*limit;
    const query ={
        isDeleted:{$ne:true}
    };
    if(search){
        query.name={
            $regex:search,
            $options:'i'
        }
    }
    const totalProducts = await Product.countDocuments(query);
    const products = await Product.find(query).populate('categoryId','name variantAtrributes')
    .sort({name:-1}).skip(skip).limit(limit).lean();
    const productIds = products.map(product=>product._id);
    const variantCounts = await productVariant.aggregate([
        {
            $match:{
                productId:{$in:productIds}
            },
        },
            {
                $group:{_id:'$productId',
                    count:{$sum:1},
                    activeCount:{$sum:{$cond:[{$eq:['$isActive',true]},1,0]}},
                    totalStock:{$sum:'$stock'}}
        }
        
    ]);
    const variantCountMap = {};
    variantCounts.forEach(item=>{
        variantCountMap[item._id.toString()]={count:item.count,totalStock:item.totalStock};
    });
    products.forEach(product =>{
        const variantData =variantCountMap[product._id.toString()]||{
            count:0,
            activeCount:0,
            totalStock:0
        } ;
        product.variantCount = variantData.count||0;
        product.activeVariantCount=variantData.activeCount;
        product.requireVariants = 
                            Array.isArray(product.categoryId?.variantAttributes)&&
                            product.categoryId.variantAttributes.length>0;
        product.canBeListed = !product.requireVariants||product.activeVariantCount>0;
        product.totalStock = product.variantCount
                            ?variantData.totalStock
                            :product.stockLevel

    })
    const totalPages = Math.ceil(totalProducts/limit);
    
    return {
        products,
        currentPage:page,
        totalPages
    }
}
const createProduct = async(productData)=>{
    console.log("PRODUCT DATA",productData);
    return await Product.create(productData)
};
const findProductById = async(id)=>{
    return await Product.findById({
        _id:id,
        isDeleted:{$ne:true}
    });
};
const findProductByName = async(name)=>{
    return await Product.findOne({
        name:{
            $regex:`^${name}$`,$options:'i'
        },
        isDeleted:{$ne:true}
    });
};
const findProductByNameExpectId = async(name, id)=>{
    return await Product.findOne({
        name:{
            $regex:`^${name}$`,$options:'i'
        },
        _id:{$ne:id},
        isDeleted:{$ne:true}
    });
};
const updateProduct = async(id, productData)=>{
    const existingProduct = await Product.findOne({
        _id:id,
        isDeleted:false
    });
    if(!existingProduct){
        throw new Error('Product not found');
    };
    const categoryChanged = String(existingProduct.categoryId||'') !== String(productData.categoryId ||'');
    if(categoryChanged){
        await productVariant.deleteMany({productId:existingProduct._id});
        productData= {
            ...productData,
            isListed:false
        }
    }

    return await Product.findOneAndUpdate(
        {_id:id,isDeleted:{$ne:true}},
        productData,
        {new:true,runValidators:true}
    );
};
const updateProductStatus = async(id, isListed)=>{
    return await Product.findOneAndUpdate(
        {_id:id,isDeleted:{$ne:true}},
        {isListed},
        {new:true,runValidators:true}
    );
};
const deleteProduct = async (id)=>{
    return await Product.findByIdAndUpdate(
        {_id:id},
        {isDeleted:true},
        {new:true}
);
};
module.exports={
    getAllProducts,
    createProduct,
    findProductById,
    findProductByName,
    findProductByNameExpectId,
    updateProduct,
    updateProductStatus,
    deleteProduct
}
