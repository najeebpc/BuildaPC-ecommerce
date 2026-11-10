const productService = require('../../services/admin/productServices');
const categoryService = require('../../services/admin/categoryServices');
const productImageService = require('../../services/admin/productImageServices');
const productVariantService = require('../../services/admin/productVariantServices');
const STATUS = require('../../constants/statusCode');
const MESSAGES = require('../../constants/messages');

const loadProducts = async (req, res) => {
  try {
    const admin = req.session.admin;
    const search = req.query.search || '';
    const page = parseInt(req.query.page) || 1;
    const result = await productService.getAllProducts({ search, page });
    const categories = await categoryService.getCategories();
    res.render('admin/products', {
      products: result.products,
      currentPage: result.currentPage,
      totalPages: result.totalPages,
      search,
      categories,
      admin,
    });
  } catch (error) {
    console.log(error);
    res.status(STATUS.INTERNAL_SERVER_ERROR).send('somthng went wrong');
  }
};
const createProduct = async (req, res) => {
  try {
    console.log(req.body);
    const {
      name,
      basePrice,
      stockLevel,
      productType,
      categoryId,
      description,
      features,
      specifications,
    } = req.body;

    if (!name || name.trim() === '') {
      return res.status(STATUS.BAD_REQUEST).json({
        field: 'name',
        message: MESSAGES.PRODUCT_NAME_REQUIRED,
      });
    }
    if (basePrice === undefined || basePrice === '') {
      return res.status(STATUS.BAD_REQUEST).json({
        field: 'basePrice',
        message: MESSAGES.PRODUCT_PRICE_REQUIRED,
      });
    }
    if (Number(basePrice) < 0) {
      return res.status(STATUS.BAD_REQUEST).json({
        field: 'basePrice',
        message: MESSAGES.PRODUCT_PRICE_INVALID,
      });
    }
    if (!productType) {
      return res.status(STATUS.BAD_REQUEST).json({
        field: 'productType',
        message: MESSAGES.PRODUCT_TYPE_REQUIRED,
      });
    }
    const finalCategoryId = productType === 'pre_built' ? null : categoryId;
    if (productType === 'component') {
      const category = await categoryService.findCategoryById(categoryId);
      if (!category || category.isDeleted) {
        return res.status(STATUS.BAD_REQUEST).json({
          field: 'categoryId',
          message: MESSAGES.CATEGORY_NOT_EXIST,
        });
      }
    }
    const existingProductName = await productService.findProductByName(name.trim());
    if (existingProductName) {
      return res.status(STATUS.BAD_REQUEST).json({
        field: 'name',
        message: MESSAGES.PRODUCT_EXISTS,
      });
    }
    if (!req.files || req.files.length < 3) {
      return res.status(STATUS.BAD_REQUEST).json({
        field: 'primaryImage',
        message: MESSAGES.PRODUCT_IMAGE_REQUIRED,
      });
    }
    const uploadedImages = [];
    for (const file of req.files) {
      const result = await productImageService.uploadProductImage(file.buffer);
      uploadedImages.push(result.secure_url);
    }
    let parsedSpecification = [];
    if (specifications) {
      parsedSpecification = JSON.parse(specifications);
    }
    const product = await productService.createProduct({
      name: name.trim(),
      basePrice: Number(basePrice),
      stockLevel,
      productType,
      categoryId: finalCategoryId,
      primaryImage: uploadedImages[0],
      secondaryImages: uploadedImages.slice(1),
      description: description || '',
      features: features || '',
      specifications: parsedSpecification,
    });
    return res.status(STATUS.OK).json({
      success: true,
      message: MESSAGES.PRODUCT_CREATED,
      product,
    });
  } catch (error) {
    console.log(error);
    return res.status(STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: MESSAGES.PRODUCT_CREATE_FAILED,
    });
  }
};
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      basePrice,
      stockLevel,
      productType,
      categoryId,
      description,
      features,
      specifications,
      existingSecondaryImages,
    } = req.body;
    const newPrimaryImageFile = req.files?.newPrimaryImage?.[0];
    const newGalleryFiles = req.files?.galleryImages || [];
    const existingProduct = await productService.findProductById(id);
    if (!existingProduct) {
      return res.status(STATUS.BAD_REQUEST).json({
        filed: 'name',
        message: MESSAGE.PRODUCT_NOT_FOUND,
      });
    }
    if (!name || name.trim() === '') {
      return res.status(STATUS.BAD_REQUEST).json({
        field: 'name',
        massage: MESSAGES.PRODUCT_NAME_REQUIRED,
      });
    }
    if (basePrice === undefined || basePrice === '') {
      return res.status(STATUS.BAD_REQUEST).json({
        field: 'basePrice',
        message: MESSAGES.PRODUCT_PRICE_REQUIRED,
      });
    }
    if (stockLevel === undefined || stockLevel === '' || Number(stockLevel) < 0) {
      return res.status(400).json({
        field: 'stockLevel',
        message: MESSAGES.PROCUCT_STOCK_REQUIRED,
      });
    }
    if (!productType) {
      return res.status(STATUS.BAD_REQUEST).json({
        field: 'productType',
        message: MESSAGES.PRODUCT_TYPE_REQUIRED,
      });
    }
    const finalCategoryId = productType === 'pre_built' ? null : categoryId;
    let parsedSpecification = [];
    if (specifications) {
      parsedSpecification = JSON.parse(specifications);
    }
    let remainingSecondaryImages = [];
    if (existingSecondaryImages) {
      remainingSecondaryImages = JSON.parse(existingSecondaryImages);
    }

    let primaryImage = existingProduct.primaryImage;
    let secondaryImages = [...remainingSecondaryImages];
    if (newPrimaryImageFile) {
      const result = await productImageService.uploadProductImage(newPrimaryImageFile.buffer);
      primaryImage = result.secure_url;
    }
    for (const file of newGalleryFiles) {
      const result = await productImageService.uploadProductImage(file.buffer);
      secondaryImages.push(result.secure_url);
    }
    const totalImages = (primaryImage ? 1 : 0) + secondaryImages.length;
    if (totalImages < 3) {
      return res.status(STATUS.BAD_REQUEST).json({
        field: 'primaryImage',
        message: MESSAGES.PRODUCT_IMAGE_REQUIRED,
      });
    }
    const product = await productService.updateProduct(id, {
      name: name.trim(),
      basePrice: Number(basePrice),
      stockLevel: Number(stockLevel),
      categoryId: finalCategoryId,
      primaryImage,
      secondaryImages,
      description: description || '',
      features: features || '',
      specifications: parsedSpecification,
    });
    return res.status(STATUS.OK).json({
      success: true,
      message: MESSAGES.PRODUCT_UPDATED,
      product,
    });
  } catch (error) {
    console.log(error);
    return res.status(STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: MESSAGES.PRODUCT_UPDATE_FAILED,
    });
  }
};
const updateProductStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const isListed = req.body.isListed === true || req.body.isListed === 'true';
    const product = await productService.findProductById(id);
    if (!product) {
      return res.status(STATUS.BAD_REQUEST).json({
        success: false,
        message: MESSAGES.PRODUCT_NOT_FOUND,
      });
    }
    if (isListed) {
      const category = product.categoryId
        ? await categoryService.findCategoryById(product.categoryId)
        : null;
      const requireVariants =
        Array.isArray(category?.variantAttributes) && category.variantAttributes.length > 0;
      if (requireVariants) {
        const activeVariantCount = await productVariantService.countActiveVariants(id);
        if (activeVariantCount === 0) {
          return res.status(STATUS.BAD_REQUEST).json({
            success: false,
            message: MESSAGES.VARIANT_NEEDED,
          });
        }
      }
    }
    const updatedProduct = await productService.updateProductStatus(id, isListed);
    return res.status(STATUS.OK).json({
      success: true,
      message: isListed ? MESSAGES.PRODUCT_LISTED : MESSAGES.PRODUCT_UNLISTED,
      product: updatedProduct,
    });
  } catch (error) {
    console.log(error);
    return res.status(STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: MESSAGES.PRODUCT_STATUS_FAILED,
    });
  }
};
const loadProductVariants = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await productVariantService.getProductVariantData(id);
    return res.status(STATUS.OK).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.log(error);
    return res.status(STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: MESSAGES.VARIANT_LOADING_FAILED,
    });
  }
};
const createProductVariant = async (req, res) => {
  try {
    const { id } = req.params;
    const { attributes, price, stock, isActive } = req.body;
    const variant = await productVariantService.createVariant(id, {
      attributes,
      price,
      stock,
      isActive,
    });
    return res.status(STATUS.OK).json({
      success: true,
      message: MESSAGES.VARIANT_ADDED,
      data: variant,
    });
  } catch (error) {
    console.log('Failed to add variants ', error);
    return res.status(STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};
const updateProductVariant = async (req, res) => {
  try {
    const { id, variantId } = req.params;
    const { attributes, price, stock, isActive } = req.body;
    const variant = await productVariantService.updateVariant(id, variantId, {
      attributes,
      price,
      stock,
      isActive,
    });
    return res.status(STATUS.OK).json({
      success: true,
      message: MESSAGES.VARIANT_UPDATED,
      data: variant,
    });
  } catch (error) {
    console.log('Update product variant error', error);
    return res.status(STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};
const deleteProductVariant = async (req, res) => {
  try {
    const { id, variantId } = req.params;
    await productVariantService.deleteVariant(id, variantId);
    return res.status(STATUS.OK).json({
      success: true,
      message: MESSAGES.VARIANT_DELETE,
    });
  } catch (error) {
    return res.status(STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: MESSAGES.VARIANT_DELETE_FAILED,
    });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await productService.findProductById(id);
    if (!product) {
      return res.status(STATUS.BAD_REQUEST).json({
        sucess: false,
        message: MESSAGES.PRODUCT_NOT_FOUND,
      });
    }
    await productService.deleteProduct(id);
    return res.status(STATUS.OK).json({
      success: true,
      message: MESSAGES.PRODUCT_DELETED,
    });
  } catch (error) {
    console.log(error);
    return res.status(STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: MESSAGES.PRODUCT_DELETE_FAILED,
    });
  }
};
module.exports = {
  loadProducts,
  createProduct,
  updateProduct,
  updateProductStatus,
  loadProductVariants,
  createProductVariant,
  updateProductVariant,
  deleteProductVariant,
  deleteProduct,
};
