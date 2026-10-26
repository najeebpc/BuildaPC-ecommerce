const Product = require('../../model/productSchema');
const Category = require('../../model/categorySchema');
const ProductVariant = require('../../model/variantSchema');
const Wishlist = require('../../model/wishlistSchema');
const offerServices = require('../../services/admin/offerServices');

const addOfferPricing = async (products) => {
    return Promise.all(
        products.map(async (product) => {
            const pricing = await offerServices.getBestOfferForProduct(
                product._id
            );
            const originalPrice = Number(
                pricing?.originalPrice ?? product.basePrice
            );
            const discountAmount = Number(
                pricing?.discountAmount ?? 0
            );
            return {
                ...product,
                originalPrice,
                discountAmount,
                finalPrice: Number(
                    pricing?.finalPrice ?? (originalPrice - discountAmount)
                ),
                discountPercentage: Number(
                    pricing?.discountPercentage ?? 0
                ),
                offerType: pricing?.offerType ?? null,
                offerId: pricing?.offerId ?? null
            };
        })
    );
};
const getProducts = async ({
    search,
    category,
    minPrice,
    maxPrice,
    sort,
    page,
    productType,
    userId
}) => {
    const limit = 9;
    const currentPage = Math.max(parseInt(page)||1,1);
    const skip = (currentPage-1)*limit;
    const query ={
        isListed:true,
        isDeleted:false,
        productType,

    
    };
    if(search &&search.trim()!==''){
        const searchRegex = {
            $regex:search.trim(),$options:'i'
        };
        const matchingCategories = await Category.find({
            name:searchRegex,isDeleted:false,isListed:true
        }).select('_id').lean();
        const categoryIds = matchingCategories.map(category=>category._id);
        query.$or=[{
            name:searchRegex
        },
        {
            categoryId:{$in:categoryIds}
                }   
          ]
    }
    if(Array.isArray(category)&&category.length>0){
        query.categoryId={$in:category};
    }
    const minimumPrice = minPrice!==''?Number(minPrice):null;
    const maximumPrice = maxPrice!==''?Number(maxPrice):null;
    if(minimumPrice !==null && !Number.isNaN(minimumPrice)){
        query.basePrice = {
            $gte:minimumPrice
        };
    }
    if(maximumPrice !==null && !Number.isNaN(maximumPrice)){
        if(query.basePrice){
            query.basePrice.$lte = maximumPrice;
        }else{
            query.basePrice={
                $lte:maximumPrice
            };
        }
    }


    let sortOption = {createdAt:-1};
    switch(sort){
        case'price_asc':
        sortOption = {basePrice:1};
    
    break;
    case 'price_desc':
        sortOption={basePrice:-1};
        break;
    case 'name_asc':
        sortOption={name:1};
        break;
    case 'name_desc':
        sortOption={name:-1};
        break;
    default:
        sortOption = {createdAt:-1 };
        break;
    }
    const requiredCategories = await Category.distinct('_id',{variantAttributes:{$ne:[]}});
    const activeVariantCount = await ProductVariant.distinct('productId',{isActive:true});
    query.$and =[
        ...(query.$and||[]),
        {$or:[
            {categoryId:{$nin:requiredCategories}},
            {_id:{$in:activeVariantCount}}
        ]}
    ]
    const totalProducts = await Product.countDocuments(query);
    const products = await Product.find(query)
                        .populate('categoryId','name')
                        .sort(sortOption)
                        .skip(skip)
                        .limit(limit)
                        .lean()
    const productIds = products.map(product=>product._id);                 
    const variantCounts = await ProductVariant.aggregate([
        {$match:{productId:{$in:productIds}}},
        {$group:{_id:'$productId',count:{$sum:1}}}
    ]);
    const variantCountMap={};
    variantCounts.forEach(item=>{variantCountMap[item._id.toString()]=item.count;});
    products.forEach(product=>{product.variantCount=variantCountMap[product._id.toString()]||0;}); 
    let wishlistProductIds = new Set();
    if(userId){
        const wishlist = await Wishlist.findOne({userId}).lean();
        if(wishlist){
            wishlist.products.forEach(item=>{wishlistProductIds.add(item.productId.toString())});
        }
    }
    products.forEach(product=>{product.isInWishlist=wishlistProductIds.has(product._id.toString())}) ;
    const productWithOffers = await addOfferPricing(products);
    const totalPages = Math.ceil(totalProducts/limit);
    return{
        products:productWithOffers,
        totalProducts,
        currentPage,
        totalPages
    };
};

    const getProductDetails = async(id,userId)=>{
        const product = await Product.findOne({
            _id:id,
            isListed:true,
            isDeleted :false
        }).populate('categoryId','name variantAttributes').lean();
        if(!product){
            return;
        }
        const variants = await ProductVariant.find({
            productId:product._id,
            isActive:true,
        }).sort({createdAt:1}).lean();
        const wishlist = await Wishlist.findOne({userId}).lean();
        const wishlistItems = wishlist?.products || [];
        variants.forEach(variant => {
            variant.isInWishlist = wishlistItems.some(item =>
            item.productId.toString() === product._id.toString() &&
            String(item.variantId || '') === variant._id.toString()
            );
        });
         if (variants.length === 0) {
        product.isInWishlist = wishlistItems.some(item =>
            item.productId.toString() === product._id.toString() &&
            !item.variantId
            );
        }
        const basePricing = await offerServices.getBestOfferForProduct(
            product._id
        );

        product.originalPrice = basePricing.originalPrice;
        product.discountAmount = basePricing.discountAmount;
        product.finalPrice = basePricing.finalPrice;
        product.discountPercentage = basePricing.discountPercentage;
        product.offerType = basePricing.offerType;
        product.offerId = basePricing.offerId;

        const variantsWithPricing = await Promise.all(
                variants.map(async (variant) => {
            const pricing = await offerServices.getBestOfferForProduct(
            product._id,
            variant._id
            );

        return {
            ...variant,
            originalPrice: pricing.originalPrice,
            discountAmount: pricing.discountAmount,
            finalPrice: pricing.finalPrice,
            discountPercentage: pricing.discountPercentage,
            offerType: pricing.offerType,
            offerId: pricing.offerId
        };
    })
);
        const relatedProducts = await Product.find({
            categoryId:product.categoryId?._id,
            _id:{$ne:product._id},
            isListed:true,
            isDeleted:false
        }).select('name basePrice primaryImage').limit(6).lean();

        product.variants= variantsWithPricing;
        product.relatedProducts = relatedProducts;
        return product;
    }
module.exports = {
    getProducts,
    getProductDetails
}