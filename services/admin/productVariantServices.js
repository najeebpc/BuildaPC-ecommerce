const Product = require('../../model/productSchema');
const ProductVariant = require('../../model/variantSchema');
const MESSAGES = require('../../constants/messages');

const getProductVariantData = async (productId) => {
  const product = await Product.findById(productId).populate('categoryId').lean();

  const variantAttributes = product.categoryId?.variantAttributes || [];
  const variants = await ProductVariant.find({
    productId: productId,
  }).lean();
  return {
    product,
    variantAttributes,
    variants,
  };
};
const validateVariant = async (productId, variantData, variantId = null) => {
  const product = await Product.findById(productId).populate('categoryId');

  if (!product) {
    throw new Error(MESSAGES.PRODUCT_NOT_FOUND);
  }
  if (!product.categoryId) {
    throw new Error(MESSAGES.CATEGORY_NOT_FOUND);
  }
  const allowedValue = (value) => {
    return value.trim().toLowerCase().replace(/\s+/g, '');
  };
  const allowedAttributes = product.categoryId.variantAttributes || [];

  if (!Array.isArray(variantData.attributes) || variantData.attributes.length === 0) {
    throw new Error(MESSAGES.VARIANT_ATTRIBUTE_REQUIRED);
  }

  if (
    variantData.price === undefined ||
    variantData.price === null ||
    variantData.price === '' ||
    !Number.isFinite(Number(variantData.price)) ||
    Number(variantData.price) < 0
  ) {
    throw new Error(MESSAGES.INVALID_VARIANT_PRICE);
  }

  if (
    variantData.stock === undefined ||
    variantData.stock === null ||
    variantData.stock === '' ||
    !Number.isInteger(Number(variantData.stock)) ||
    Number(variantData.stock) < 0
  ) {
    throw new Error(MESSAGES.INVALID_VARIANT_STOCK);
  }
  const normalizedAttributes = variantData.attributes.map((attribute) => {
    if (
      typeof attribute.name !== 'string' ||
      typeof attribute.value !== 'string' ||
      !attribute.name.trim() ||
      !attribute.value.trim()
    ) {
      throw new Error(MESSAGES.VARIANT_ATTRIBUTE_FIELD_REQUIRED);
    }

    const name = allowedValue(attribute.name);
    const value = allowedValue(attribute.value);

    const isAllowed = allowedAttributes.some((allowed) => allowedValue(allowed) === name);
    if (!isAllowed) {
      throw new Error(`${attribute.name} is not allowed for this category`);
    }
    return { name, value };
  });
  const attributeNames = normalizedAttributes.map((attribute) => attribute.name);

  if (new Set(attributeNames).size !== attributeNames.length) {
    throw new Error(MESSAGES.VARIANT_ATTRIBUTE_EXIST);
  }
  const query = { productId };
  if (variantId) {
    query._id = { $ne: variantId };
  }
  const existingVariants = await ProductVariant.find(query).select('attributes');

  const isDuplicate = existingVariants.some((existingVariant) => {
    const existingAttributes = existingVariant.attributes.map((attribute) => ({
      name: allowedValue(attribute.name),
      value: allowedValue(attribute.value),
    }));
    if (existingAttributes.length !== normalizedAttributes.length) {
      return false;
    }
    const existingMap = new Map(
      existingAttributes.map((attribute) => [attribute.name, attribute.value]),
    );
    return normalizedAttributes.every(
      (attribute) => existingMap.get(attribute.name) === attribute.value,
    );
  });
  if (isDuplicate) {
    throw new Error(MESSAGES.VARIANT_EXSIST);
  }
  return true;
};
const createVariant = async (productId, variantData) => {
  await validateVariant(productId, variantData);

  const variant = await ProductVariant.create({
    productId,
    attributes: variantData.attributes,
    price: variantData.price,
    stock: variantData.stock,
    isActive: variantData.isActive,
  });
  return variant;
};
const updateVariant = async (productId, variantId, variantData) => {
  await validateVariant(productId, variantData, variantId);
  const variant = await ProductVariant.findOneAndUpdate(
    {
      _id: variantId,
      productId: productId,
    },
    {
      attributes: variantData.attributes,
      price: variantData.price,
      stock: variantData.stock,
      isActive: variantData.isActive,
    },
    {
      new: true,
      runValidators: true,
    },
  );
  if (!variant) {
    throw new Error(MESSAGES.VARIANT_NOT_FOUND);
  }
  return variant;
};
const deleteVariant = async (productId, variantId) => {
  const variant = await ProductVariant.findOneAndDelete({
    _id: variantId,
    productId: productId,
  });
  if (!variant) {
    throw new Error(MESSAGES.VARIANT_NOT_FOUND);
  }
  return variant;
};
const countActiveVariants = async (productId) => {
  return ProductVariant.countDocuments({ productId, isActive: true });
};
module.exports = {
  getProductVariantData,
  createVariant,
  updateVariant,
  deleteVariant,
  countActiveVariants,
};
