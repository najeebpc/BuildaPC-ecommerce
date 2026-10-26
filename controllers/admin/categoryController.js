
const categoryService = require('../../services/admin/categoryServices');
const MESSAGES = require('../../constants/messages');

const loadCategories = async(req,res)=>{
    try{
        const admin = req.session.admin;
        const search = req.query.search ||'';
        const currentPage = parseInt(req.query.page)||1;
        const result = await categoryService.getAllCategories({search, page:currentPage})
        
        res.render('admin/categories',{
            categories:result.categories,
            search,
            currentPage:result.currentPage,
            totalPages:result.totalPages,
            admin
        })
    }catch(error){
        console.log(error);
        res.status(500).send('Somthing wrong');
    }
}
const validateVariantAttributes = (variantAttributes) => {
    const attributes = Array.isArray(variantAttributes)
        ? variantAttributes
        : variantAttributes ? [variantAttributes] : [];
    const names = attributes.map(attr =>
        attr.trim().toLowerCase().replace(/\s+/g, '')
    );
    return names.every(name => name !== '') &&
           new Set(names).size === names.length;
};
const createCategory = async(req,res)=>{
    try{
        const  {name,isListed,variantAttributes} = req.body ;
       console.log('req.body:', req.body);

        if(!name||name.length<3){
            return res.status(400).json({
                success:false,
                message:MESSAGES.CATE_NAME_REQUIRED
            });
        }
        if(!/^[a-zA-Z0-9]+(?:[ &'-][a-zA-Z0-9]+)*$/.test(name)){
            return res.status(400).json({
                success:false,
                message:MESSAGES.CATEGORY_NAME_INVALID
            })
        }
        const categoryName = name.trim();
        const existingCategory = await categoryService.findCategoryByName(categoryName)
        if(existingCategory){
            return res.status(400).json({
                success:false,
                message:MESSAGES.CATEGORY_EXIST
            })
        }
        if(!validateVariantAttributes(variantAttributes)){
            return res.status(400).json({
                success:false,
                message:'variant already created'
            })
        }
        const category = await categoryService.createCategory({
            name:categoryName,
            isListed,
            variantAttributes:variantAttributes||[]
        })
        res.status(201).json({
            success:true,
            message:MESSAGES.CATEGORY_CREATED,
            category
        });
    }catch(error){
        console.log(error);
        res.status(500).json({
            success:false,
            message:MESSAGES.CATEGORY_FAILED
        });
    }
}
const updateCategory = async(req,res)=>{
    try{
        const {id} = req.params;
        const {name, isListed, variantAttributes} = req.body;
        if(!name || name.trim()===''){
            return res.status(400).json({
                success:false,
                message:MESSAGES.CATE_NAME_REQUIRED
            });
        }
        const categoryName = name.trim();
        const existingCategory = await categoryService.findCategoryByNameExceptId(categoryName, id)
        if(existingCategory){
            return res.status(400).json({
                success:false,
                message:MESSAGES.CATEGORY_EXIST
            });
        }
         if(!validateVariantAttributes(variantAttributes)){
            return res.status(400).json({
                success:false,
                message:'variant already created'
            })
        }
        const updatedCategory = await categoryService.updateCategory(id,{
            name:categoryName,
            isListed,
            variantAttributes:variantAttributes||[]
        })
        if(!updatedCategory){
            return res.status(404).json({
                success:false,
                message:MESSAGES.CATEGORY_NOT_FOUND
            });
        }
        res.status(200).json({
            success:true,
            message:MESSAGES.CATEGORY_UPDATED
        });
    }catch(error){
        console.log(error);
        res.status(500).json({
            success:false,
            message:MESSAGES.CATEGORY_FAILED
        })
    }
}
const updateCategoryStatus = async(req,res)=>{
    try{
        const {id} = req.params;
        const {isListed} = req.body;
        console.log('ID:', id);
        console.log('isListed:', isListed);
        console.log('type:', typeof isListed);
        const category = await categoryService.updateCategoryStatus(id, isListed);
        if(!category){
            return res.status(404).json({
                success:false,
                message:MESSAGES.CATEGORY_NOT_FOUND
            })
        }
        return res.status(200).json({
            success:true,
            message:isListed ? MESSAGES.CATEGORY_LISTED : MESSAGES.CATEGORY_UNLISTED,
            category
        })
    }catch(error){
        console.log(error);
        console.log(error.stack)
        return res.status(500).json({
            success:false,
            message:MESSAGES.CATEGORY_STATUS_FAILED
        })
    }
}
const deleteCategory = async(req,res)=>{
    try{
        const {id} = req.params;
        const category = await categoryService.deleteCategory(id);
        if(!category){
            return res.status(404).json({
                success:false,
                message:MESSAGES.CATEGORY_NOT_FOUND
            });
        }
        return res.status(200).json({
            success:true,
            message:MESSAGES.CATEGORY_DELETED
        })
    }catch(error){
        console.log(error);
        return res.status(500).json({
            success:false,
            message:MESSAGE.MESSAGE.CATEGORY_DELETE_FAILED
        })
    }
}
module.exports={
    loadCategories,
    createCategory,
    updateCategory,
    updateCategoryStatus,
    deleteCategory
}