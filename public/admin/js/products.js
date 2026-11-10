const productModal = document.getElementById('productModal');
const productModalTitle = document.getElementById('productModalTitle');
const productModalSubtitle = document.getElementById('productModalSubtitle');
const productModalSaveBtn = document.getElementById('productModalSaveBtn');
const productModalCancelBtn = document.getElementById('productModalCancelBtn');
const productName = document.getElementById('productName');
const productPrice = document.getElementById('productPrice');
const productStock = document.getElementById('productStock');
const productNameError = document.getElementById('productNameError');
const productPriceError = document.getElementById('productPriceError');
const productStockError = document.getElementById('productStockError');
const productType = document.getElementById('productType');
const productTypeError = document.getElementById('productTypeError');
const productCategory = document.getElementById('productCategory');
const productCategoryError = document.getElementById('productCategoryError');
const primaryImageUpload = document.getElementById('primaryImageUpload');
const primaryImageInput = document.getElementById('primaryImageInput');
const primaryImageError = document.getElementById('primaryImageError');
const addGalleryImageBtn = document.getElementById('addGalleryImageBtn');
const galleryUploadGrid = document.getElementById('galleryUploadGrid');
const productDescription = document.getElementById('productDescription');
const productFeaturesEditor = document.getElementById('productFeaturesEditor');
const specificationsContainer = document.getElementById('specificationsContainer');

const imageCropModal = document.getElementById('imageCropModal');
const cropImage = document.getElementById('cropImage');
const applyCropBtn = document.getElementById('applyCropBtn');
const cancelCropBtn = document.getElementById('cancelCropBtn');
const closeCropModal = document.getElementById('closeCropModal');
let cropper = null;
let cropTarget = null;
function openCropModal(file, target) {
  cropTarget = target;
  const imageUrl = URL.createObjectURL(file);
  cropImage.src = imageUrl;
  imageCropModal.style.display = 'flex';
  cropImage.onload = function () {
    if (cropper) {
      cropper.destroy();
    }
    cropper = new Cropper(cropImage, {
      aspectRation: 1,
      viewMode: 1,
      dragMode: 'move',
      autoCropArea: 1,
      responsive: true,
      background: false,
    });
  };
}
applyCropBtn.addEventListener('click', function () {
  if (!cropper) {
    return;
  }
  cropper
    .getCroppedCanvas({
      width: 1000,
      height: 1000,
      imageSmoothingEnabled: true,
      imageSmoothingQuality: 'high',
    })
    .toBlob(
      function (blob) {
        const file = new File([blob], 'product-image.jpg', { type: 'image/jpeg' });
        if (cropTarget === 'primary') {
          newPrimaryImage = file;
          showPrimaryImagePreview(file);
          primaryImageError.textContent = '';
        } else {
          galleryImages.push(file);
          createGalleryPreview(file);
          primaryImageError.textContent = '';
        }
        closeImageCropModal();
      },
      'image/type',
      0.9,
    );
});
function closeImageCropModal() {
  imageCropModal.style.display = 'none';
  if (cropper) {
    cropper.destroy();
  }
  cropImage.src = '';
  cropTarget = null;
}
cancelCropBtn.addEventListener('click', closeImageCropModal);
closeCropModal.addEventListener('click', closeImageCropModal);
const featuresEditor = new Quill('#productFeaturesEditor', {
  theme: 'snow',
  modules: {
    toolbar: [['bold', 'italic'], [{ list: 'bullet' }]],
  },
  placeholder: 'Enter product features...',
});

let productModalMode = 'add';
let editingProductId = null;
let existingSecondaryImages = [];
let newPrimaryImage = null;
let galleryImages = [];

primaryImageUpload.addEventListener('click', () => {
  primaryImageInput.click();
});
primaryImageInput.addEventListener('change', function () {
  if (!this.files.length) {
    return;
  }
  openCropModal(this.files[0], 'primary');
  this.value = '';
});
function showPrimaryImagePreview(file) {
  const imageUrl = URL.createObjectURL(file);
  primaryImageUpload.innerHTML = `<img
            src="${imageUrl}"
            class="primary-image-preview"
            alt="Primary Product image">`;
}
addGalleryImageBtn.addEventListener('click', addGalleyImageInput);
function addGalleyImageInput() {
  const input = document.createElement('input');
  input.type = 'file';
  input.className = 'gallery-image-input';
  input.accept = 'image/png,image/jpeg,image/werbp';
  input.hidden = true;
  input.addEventListener('change', function () {
    if (!this.files.length > 0) {
      return;
    }
    openCropModal(this.files[0], 'gallery');
    this.value = '';
  });
  galleryUploadGrid.appendChild(input);
  input.click();
}
function createGalleryPreview(file) {
  const imageUrl = URL.createObjectURL(file);
  const preview = document.createElement('div');
  preview.classList.add('gallery-image-preview');
  preview.innerHTML = `
        <img src="${imageUrl}"
            alt="Product additional image">
        <button type="button"
                class="remove-gallery-image">×</button>`;
  preview.querySelector('.remove-gallery-image').addEventListener('click', function () {
    const index = galleryImages.indexOf(file);
    if (index !== -1) {
      galleryImages.splice(index);
    }
    preview.remove();
  });
  galleryUploadGrid.appendChild(preview);
}
function openAddProductModal() {
  productModalMode = 'add';
  editingProductId = null;
  productModalTitle.textContent = 'Add New Product';
  productModalSubtitle.textContent = 'Create a new product';
  productModalSaveBtn.textContent = 'Save Product';
  productModalSaveBtn.disabled = false;
  clearProductForm();
  productModal.style.display = 'flex';
}
function clearProductForm() {
  productName.value = '';
  productPrice.value = '';
  productStock.value = '';
  productType.value = '';
  productCategory.value = '';
  primaryImageInput.value = '';
  newPrimaryImage = null;
  galleryImages = [];
  primaryImageUpload.innerHTML = `
        <span class="upload-icon">+</span>
    `;
  galleryUploadGrid.innerHTML = '';
  productDescription.value = '';
  featuresEditor.setContents([]);
  specificationsContainer.innerHTML = '';

  productNameError.textContent = '';
  productPriceError.textContent = '';
  productStockError.textContent = '';
  productTypeError.textContent = '';
  productCategoryError.textContent = '';
  primaryImageError.textContent = '';
  productName.classList.remove('input-error');
  productPrice.classList.remove('input-error');
  productStock.classList.remove('input-error');
  productCategory.classList.remove('input-error');
}
document.querySelectorAll('.edit-product-link').forEach((link) => {
  link.addEventListener('click', function (e) {
    e.preventDefault();
    const product = JSON.parse(decodeURIComponent(this.dataset.product));
    openEditProductModal(product);
  });
});
let originalProductCategoryId = null;
function getCategoryId(category) {
  return String(category?._id || category || '');
}
function openEditProductModal(product) {
  productModalMode = 'edit';
  editingProductId = product._id;
  productModalTitle.textContent = `Edit Product: ${product.name}`;
  productModalSubtitle.textContent = 'Update product information';
  productModalSaveBtn.disabled = false;
  productModalSaveBtn.textContent = 'Save Changes';
  productName.value = product.name;
  productPrice.value = product.basePrice;
  productStock.value = product.stockLevel;
  productType.value = product.productType;
  if (product.categoryId) {
    productCategory.value = product.categoryId._id;
  } else {
    productCategory.value = '';
  }
  originalProductCategoryId = getCategoryId(product.categoryId);
  productDescription.value = product.description;
  featuresEditor.root.innerHTML = product.features || '';
  loadspecification(product.specifications || []);
  loadExistingProductImages(product);
  productModal.style.display = 'flex';
}
productCategory.addEventListener('change', function () {
  if (!originalProductCategoryId) return;
  const selectedCategoryId = this.value;
  if (selectedCategoryId && selectedCategoryId !== originalProductCategoryId) {
    const confirmed = confirm('All existing variants will be removed. Do you want to continue?');
    if (!confirmed) {
      this.value = originalProductCategoryId;
    }
  }
});
function closeProductModal() {
  clearProductForm();
  productModal.style.display = 'none';
}
productType.addEventListener('change', function () {
  if (this.value === 'pre_built') {
    productCategory.value = '';
    productCategory.disabled = true;
  } else {
    productCategory.disabled = false;
  }
});

function loadExistingProductImages(product) {
  galleryImages = [];
  primaryImageInput.value = '';
  if (product.primaryImage) {
    primaryImageUpload.innerHTML = `
            <img src="${product.primaryImage}"
                 class="gallery-image-preview"
                 alt="Primary product image">`;
  } else {
    primaryImageUpload.innerHTML = `<span class= "gallery-placeholder">+</span>`;
  }
  existingSecondaryImages = [...(product.secondaryImages || [])];
  renderExistingGalleryImages();
}
function renderExistingGalleryImages() {
  galleryUploadGrid.innerHTML = '';
  existingSecondaryImages.forEach((imageUrl, index) => {
    const preview = document.createElement('div');
    preview.classList.add('gallery-image-preview');
    preview.innerHTML = `
            <img src="${imageUrl}"
                 alt="Product gallery image">
                 <button type="button"
                         class="remove-gallery-image"
                         date-index="${index}">×</button>`;
    preview.querySelector('.remove-gallery-image').addEventListener('click', function () {
      const imageIndex = Number(this.dataset.index);
      existingSecondaryImages.splice(imageIndex, 1);
      renderExistingGalleryImages();
    });
    galleryUploadGrid.appendChild(preview);
  });
  galleryImages.forEach((file) => {
    createGalleryPreview(file);
  });
}
function addSpecification(name = '', value = '') {
  const row = document.createElement('div');
  row.classList.add('specification-row');
  row.innerHTML = `
        <input type= 'text' class='specification-name' placeholder ='Specification name'
        value = '${name}'>
        <input type= 'text' class='specification-value' placeholder='Specification Value'
        value = '${value}'>
        <button type= 'button' class='remove-specification-btn' onclick='removeSpecification(this)'> × </button>
        `;
  specificationsContainer.appendChild(row);
}
function loadspecification(specifications) {
  specificationsContainer.innerHTML = '';
  specifications.forEach((specification) => {
    addSpecification(specification.name, specification.value);
  });
}
function removeSpecification(button) {
  button.parentElement.remove();
}
function getSpecification() {
  const rows = specificationsContainer.querySelectorAll('.specification-row');
  return Array.from(rows).map((row) => {
    const name = row.querySelector('.specification-name').value.trim();
    const value = row.querySelector('.specification-value').value.trim();
    return { name, value };
  });
}

async function saveProduct() {
  const isValid = validateProductForm();
  if (!isValid) {
    return;
  }
  setProductSavingState(true);
  try {
    const features = featuresEditor.root.innerHTML;
    const formData = new FormData();

    formData.append('name', productName.value.trim());
    formData.append('basePrice', productPrice.value);
    formData.append('stockLevel', productStock.value);
    formData.append('productType', productType.value);
    formData.append('categoryId', productCategory.value || '');
    formData.append('description', productDescription.value.trim());
    formData.append('features', features);
    formData.append('specifications', JSON.stringify(getSpecification()));

    if (productModalMode === 'add') {
      formData.append('productImages', newPrimaryImage);
      galleryImages.forEach((image) => {
        formData.append('productImages', image);
      });
    } else {
      if (newPrimaryImage) {
        formData.append('newPrimaryImage', newPrimaryImage);
      }
      galleryImages.forEach((image) => {
        formData.append('galleryImages', image);
      });
      formData.append('existingSecondaryImages', JSON.stringify(existingSecondaryImages));
    }

    let response;
    if (productModalMode === 'add') {
      response = await fetch('/admin/products', {
        method: 'POST',
        body: formData,
      });
    } else {
      response = await fetch(`/admin/products/${editingProductId}`, {
        method: 'PUT',
        body: formData,
      });
    }
    const result = await response.json();
    if (!response.ok) {
      if (result.field && result.message) {
        showProductFieldError(result.field, result.message);
      } else {
        productMessage.textContent = result.message;
        productMessage.classList.add('error');
      }
      setProductSavingState(false);
      return;
    }
    showToastMessage(result.message, 'success');
    closeProductModal();
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  } catch (error) {
    productMessage = textContent = 'Something went wrong. Please try again';
    productMessage.classList.add('error');
    setProductSavingState(false);
  }
}
function setProductSavingState(isSaving) {
  productModalSaveBtn.disabled = isSaving;
  productModalCancelBtn.disabled = isSaving;
  if (isSaving) {
    productModalSaveBtn.textContent = 'Saving...';
  } else {
    productModalSaveBtn.textContent = productModalMode === 'add' ? 'Save Product' : 'Save Changes';
  }
}
function validateProductForm() {
  let isValid = true;

  productNameError.textContent = '';
  productPriceError.textContent = '';
  productStockError.textContent = '';
  productTypeError.textContent = '';
  productCategoryError.textContent = '';
  primaryImageError.textContent = '';
  if (!productName.value.trim()) {
    productNameError.textContent = 'Product name is required';
    isValid = false;
  }

  if (!productPrice.value.trim()) {
    productPriceError.textContent = 'Price is required';
    isValid = false;
  } else if (Number(productPrice.value) < 0) {
    productPriceError.textContent = 'Price must be greater than or equal to 0';
    isValid = false;
  }

  if (!productStock.value.trim()) {
    productStockError.textContent = 'Stock level is required';
    isValid = false;
  } else if (Number(productStock.value) < 0) {
    productStockError.textContent = 'Stock level cannot be negative';
    isValid = false;
  }

  if (!productType.value) {
    productTypeError.textContent = 'Product Type is required';
    isValid = false;
  }
  if (productType.value === 'component' && !productCategory.value) {
    productCategoryError.textContent = 'Category is required for component products';
    isValid = false;
  }
  if (productModalMode === 'add' && !newPrimaryImage) {
    primaryImageError.textContent = 'Primary image is required';
    isValid = false;
  }
  return isValid;
}
productModal.addEventListener('input', function (event) {
  if (event.target === productName) {
    if (productName.value.trim()) {
      productNameError.textContent = '';
    }
  }
  if (event.target === productPrice) {
    if (productPrice.value.trim()) {
      productPriceError.textContent = '';
    }
  }
  if (event.target === productStock) {
    if (productStock.value.trim()) {
      productStockError.textContent = '';
    }
  }
});
productModal.addEventListener('change', function (event) {
  if (event.target === productType) {
    if (productType.value) {
      productTypeError.textContent = '';
    }
  }
  if (event.target === productCategory) {
    if (productCategory.value) {
      productCategoryError.textContent = '';
    }
  }
});
function showProductFieldError(field, message) {
  if (field === 'name') {
    productNameError.textContent = message;
  }
  if (field === 'basePrice') {
    productPriceError.textContent = message;
  }
  if (field === 'stockLevel') {
    productStockError.textContent = message;
  }
  if (field === 'productType') {
    productTypeError.textContent = message;
  }
  if (field === 'categoryId') {
    productCategoryError.textContent = message;
  }
  if (field === 'primaryImage') {
    primaryImageError.textContent = message;
  }
}
function showProductMessage(message, type) {
  productMessage.textContent = message;
  productMessage.classList.remove('success', 'error');
  productMessage.classList.add(type);
  setTimeout(() => {
    productMessage.style.display = 'none';
    productMessage.textContent = '';
    productMessage.classList.remove(type);
  }, 4000);
}

const productMessage = document.getElementById('productMessage');
const savedMessage = sessionStorage.getItem('productMessage');
const savedMessageType = sessionStorage.getItem('productMessageType');
if (savedMessage) {
  productMessage.textContent = savedMessage;
  productMessage.classList.add(savedMessageType || 'success');
  sessionStorage.removeItem('productMessage');
  sessionStorage.removeItem('productMessageType');
}
document.querySelectorAll('.delete-product-link').forEach((link) => {
  link.addEventListener('click', function (e) {
    e.preventDefault();
    const productId = this.dataset.productId;
    const productName = this.dataset.productName;
    openDeleteProductModal(productId, productName);
  });
});
const deleteProductModal = document.getElementById('deleteProductModal');
const productDeleteModalText = document.getElementById('productDeleteModalText');
const confirmProductDeleteBtn = document.getElementById('confirmProductDeleteBtn');
let deletingProductId = null;
function openDeleteProductModal(productId, productName) {
  deletingProductId = productId;
  productDeleteModalText.textContent = `Are you sure you want to delete "${productName}"?`;
  deleteProductModal.style.display = 'flex';
}
function closeDeleteProductModal() {
  deleteProductModal.style.display = 'none';
  deletingProductId = null;
}
confirmProductDeleteBtn.addEventListener('click', async function () {
  if (!deletingProductId) {
    return;
  }
  try {
    const response = await fetch(`/admin/products/${deletingProductId}`, {
      method: 'DELETE',
    });
    const result = await response.json();
    if (!response.ok) {
      return;
    }

    closeDeleteProductModal();
    showToastMessage(result.message, 'success');
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  } catch (error) {
    console.log(error);
  }
});
async function toggleProductStatus(productId, isListed, checkbox) {
  try {
    const response = await fetch(`/admin/products/${productId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ isListed }),
    });
    const result = await response.json();
    if (!response.ok) {
      checkbox.checked = !isListed;
      showToastMessage(result.message, 'error');

      return;
    }
    showToastMessage(result.message, 'success');
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  } catch (error) {
    checkbox.checked = isListed;
    console.log(error);
  }
}

let currentVariantProductId = null;
let editingVariantId = null;

function openManageVariantsModal(productId) {
  currentVariantProductId = productId;
  const modal = document.getElementById('manageVariantsModal');
  modal.style.display = 'flex';
  loadProductVariants(productId);
}
function closeManageVariantsModal() {
  const modal = document.getElementById('manageVariantsModal');
  modal.style.display = 'none';
}
async function loadProductVariants(productId) {
  const attributesContainer = document.getElementById('variantAttributesContainer');
  const variantsContainer = document.getElementById('variantsContainer');
  const addVariantBtn = document.querySelector('.variant-add-btn');
  attributesContainer.innerHTML = `<p>Loading variants attributes...</p>`;
  variantsContainer.innerHTML = `<p> Loading varinats...</p>`;
  try {
    const response = await fetch(`/admin/products/${productId}/variants`);
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'failed to load variants');
    }
    const data = result.data;
    window.currentVariantAttributes = data.variantAttributes || [];
    window.currentVariants = data.variants || [];
    document.getElementById('variantProductName').textContent = data.product.name;
    if (data.variantAttributes && data.variantAttributes.length > 0) {
      attributesContainer.innerHTML = data.variantAttributes
        .map(
          (attribute) =>
            `<div class='variant-attribute-item'>
                        ${attribute}
                        </div>`,
        )
        .join('');
      addVariantBtn.disabled = false;
    } else {
      attributesContainer.innerHTML = `<p> No variant attributes are defined
                    for this category.
                    </p>`;
      addVariantBtn.disabled = true;
    }
    if (data.variants && data.variants.length > 0) {
      variantsContainer.innerHTML = data.variants
        .map((variant) => {
          const attributesHTML = variant.attributes
            .map(
              (attribute) =>
                `<span class='variant-item-attribute'>
                        <strong>${attribute.name}:</strong>
                        ${attribute.value}</span>`,
            )
            .join('');
          return `
                        <div class= variant-item>
                            <div class="variant-item-details">
                                <div class="variant-item-attributes">${attributesHTML}</div>
                                <div class="variant-item-info">
                                    <span>Price:₹${variant.price}</span>
                                    <span>Stock:${variant.stock}</span>
                                    <span>${variant.isActive ? 'Active' : 'Inactive'}</span>
                                    </div></div>
                                    <div class = 'variant-item-actions'>
                                        <a href ="#" class="variant-edit-link"
                                        onclick="editVariant('${variant._id}');return false;">Edit</a>
                                        <a href="#" class= ' variant-remove-link' 
                                        onclick = "removeVariant('${variant._id}'); return false;">Remove</a>
                                        </div></div>`;
        })
        .join('');
    } else {
      variantsContainer.innerHTML = `<p>No Variants have been added yet.</p>`;
    }
  } catch (error) {
    console.log('Load variants error', error);
    attributesContainer.innerHTML = `<p>Failed to load variants attribututes.</p>`;
  }
}
function showVariantList() {
  document.getElementById('variantListView').style.display = 'block';
  document.getElementById('variantFormView').style.display = 'none';
  document.getElementById('variantModalFooter').style.display = 'flex';
  document.getElementById('variantModalTitle').textContent = 'Manage Variants';
  document.getElementById('variantFormTitle').textContent = 'Add Variants';
  editingVariantId = null;
}
function showAddVariantForm() {
  editingVariantId = null;
  document.getElementById('variantListView').style.display = 'none';
  document.getElementById('variantFormView').style.display = 'block';
  document.getElementById('variantModalFooter').style.display = 'none';
  document.getElementById('variantModalTitle').textContent = 'Add Variant';
  document.getElementById('variantFormTitle').textContent = 'Add Variant';
  document.getElementById('variantForm').reset();
  createVariantFormfields();
}
document.getElementById('variantForm').addEventListener('submit', async function (event) {
  event.preventDefault();
  const attributes = [];
  const attributeInput = document.querySelectorAll('.variant-attribute-input');
  attributeInput.forEach((input) => {
    attributes.push({
      name: input.dataset.attributeName,
      value: input.value.trim(),
    });
  });
  const price = document.getElementById('variantPrice').value;
  const stock = document.getElementById('variantStock').value;
  const isActive = document.getElementById('variantStatus').value === 'true';
  const isEditing = editingVariantId !== null;
  const url = isEditing
    ? `/admin/products/${currentVariantProductId}/variants/${editingVariantId}`
    : `/admin/products/${currentVariantProductId}/variants`;
  const method = isEditing ? 'PUT' : 'POST';
  try {
    const response = await fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        attributes,
        price,
        stock,
        isActive,
      }),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Failed to add variants');
    }

    await loadProductVariants(currentVariantProductId);
    showVariantList();
    showVariantMessage(
      isEditing ? 'Variant updated successfully.' : 'Variant added successfully',
      'success',
    );
  } catch (error) {
    console.log('add variant error', error);
    showVariantMessage(error.message, 'error');
  }
});

function createVariantFormfields(existingAttributes = []) {
  const container = document.getElementById('variantFormAttributes');
  container.innerHTML = '';
  const attributes = window.currentVariantAttributes || [];
  attributes.forEach((attributeName) => {
    const existingAttribute = existingAttributes.find(
      (attribute) => attribute.name === attributeName,
    );
    const value = existingAttribute ? existingAttribute.value : '';
    const wrapper = document.createElement('div');
    wrapper.className = 'variant-attribute-form-group';
    wrapper.innerHTML = `
            <label>${attributeName}</label>
            <input
                type='text'
                class='variant-attribute-input'
                data-attribute-name="${attributeName}"
                value ="${value}"
                placeholder = 'Enter ${attributeName}'>`;
    container.appendChild(wrapper);
  });
}
function editVariant(variantId) {
  const variant = window.currentVariants.find((variant) => variant._id === variantId);
  if (!variant) {
    showVariantMessage('Variant not found', 'error');
    return;
  }
  editingVariantId = variantId;
  document.getElementById('variantListView').style.display = 'none';
  document.getElementById('variantFormView').style.display = 'block';
  document.getElementById('variantModalFooter').style.display = 'none';
  document.getElementById('variantModalTitle').textContent = 'Edit Variant';
  document.getElementById('variantFormTitle').textContent = 'Edit Variant';
  createVariantFormfields(variant.attributes);
  document.getElementById('variantPrice').value = variant.price;
  document.getElementById('variantStock').value = variant.stock;
  document.getElementById('variantStatus').value = String(variant.isActive);
}
async function removeVariant(variantId) {
  if (!confirm('are you sure want to remove this variant')) {
    return;
  }
  try {
    const response = await fetch(
      `/admin/products/${currentVariantProductId}/variants/${variantId}`,
      { method: 'DELETE' },
    );
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message);
    }
    await loadProductVariants(currentVariantProductId);
    showVariantMessage(result.message, 'success');
  } catch (error) {
    showVariantMessage(error.message, 'error');
  }
}
function showVariantMessage(message, type) {
  const messageBox = document.getElementById('variantResponseMessage');
  messageBox.textContent = message;
  messageBox.className = `variant-response-message ${type}`;
  setTimeout(() => {
    messageBox.textContent = '';
    messageBox.className = 'varinat-response-message';
  }, 4000);
}
