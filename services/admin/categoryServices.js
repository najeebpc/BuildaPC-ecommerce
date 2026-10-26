const Category = require('../../model/categorySchema');
const Product = require('../../model/productSchema')

const createCategory = async(categoryData)=>{
    const category = new Category(categoryData);
    return await category.save();
};
const findCategoryByName = async(name)=>{
    return await Category.findOne({
        name:{$regex:`^${name}$`,$options:'i'}
    });
};
const findCategoryByNameExceptId = async(name, id)=>{
    return await Category.findOne({
        name:{
            $regex:`^${name}$`,$options:'i'
        },
        _id:{$ne:id}
    });
}
const findCategoryById = async(id)=>{
    return await Category.findById(id);
};
const updateCategory = async(id, categoryData)=>{
    return await Category.findByIdAndUpdate(
        id,
        categoryData,
    {
        new:true,
        runValidators:true
    }
    );
};
const getCategories = async()=>{
    return await Category.find({isListed:true,isDeleted:false})
}
const getCategoriesWithProductCount = async()=>{
    const categories = await Category.aggregate([
        {
            $match:{
                isDeleted:false,
                isListed:true
            }
        },
        {
            $lookup:{
                from:'products',
                let:{
                    categoryId:'$_id'
                },
                pipeline:[{
                    $match:{
                        $expr:{$eq:['$categoryId','$$categoryId']},
                        isListed:true,
                        isDeleted:false,
                        productType:'component'
                    }
                }],
                as:'products'
            }
        },
        {
            $addFields:{
                productCount:{$size:'$products'}
            }
        },
        {
            $project:{
                name:1,
                productCount:1
            }
        },
        {
            $sort:{name:1}
        }
    ]);
    return categories
}
const getAllCategories = async({search, page})=>{
    const limit = 10;
    const skip = (page-1)* limit;
    const query = {
        isDeleted:{$ne:true}
    };
    if(search){
        query.name = {
            $regex:search,
            $options:'i'
        };
    }
    const totalCategories = await Category.countDocuments(query);
    const categories = await Category.find(query).sort({name:-1}).skip(skip).limit(limit);
    const totalPages = Math.ceil(totalCategories/limit);
    return {
        categories,
        currentPage: page,
        totalPages
    };
};
const updateCategoryStatus = async(id, isListed)=>{
    return await Category.findByIdAndUpdate(
        id,
        {isListed: isListed},
        {new:true,runValidators:true}
    );
};
const deleteCategory = async(id)=>{
    return await Category.findByIdAndUpdate(
        id,
        {isDeleted:true},
        {new:true}
    )
}

module.exports= {
    createCategory,
    findCategoryById,
    findCategoryByName,
    findCategoryByNameExceptId,
    updateCategory,
    getCategories,
    getAllCategories,
    getCategoriesWithProductCount,
    updateCategoryStatus,
    deleteCategory
}