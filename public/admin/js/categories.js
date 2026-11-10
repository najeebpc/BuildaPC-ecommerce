const categoryModal = document.getElementById('categoryModal');
const modalTitle = document.getElementById('modalTitle');
const modalSubtitle = document.getElementById('modalSubtitle');
const modalSaveBtn = document.getElementById('modalSaveBtn');
const categoryName = document.getElementById('categoryName');
const categoryStatus = document.getElementById('categoryStatus');
const statusText = document.getElementById('statusText');
const attributesInput = document.getElementById('attributeInput');
const attributesContainer = document.getElementById('attributesContainer');
const categoryAttributeError = document.getElementById('categoryAttributeError');
const categoryNameError = document.getElementById('categoryNameError');

let modalMode = 'Add';
let editingCategoryId = null;
function openAddCategoryModal() {
  modalMode = 'add';
  modalTitle.textContent = 'Add Category';
  modalSubtitle.textContent = 'Create a new product category';
  modalSaveBtn.textContent = 'Create Category';
  categoryName.value = '';
  categoryStatus.checked = true;
  attributesContainer.innerHTML = '';
  attributesInput.value = '';
  categoryModal.style.display = 'flex';
  categoryName.focus();
}
function editCategory(link) {
  const category = JSON.parse(link.dataset.category);
  openEditCategoryModal(category);
}
function openEditCategoryModal(category) {
  modalMode = 'Edit';
  modalTitle.textContent = `Edit Category: ${category.name}`;
  modalSubtitle.textContent = 'Configure category settings and variant attributes';
  modalSaveBtn.textContent = 'Save changes';
  categoryName.value = category.name;
  categoryStatus.checked = category.isListed;
  attributesContainer.innerHTML = '';
  category.variantAttributes.forEach((attribute) => {
    createAttributeTag(attribute);
  });
  editingCategoryId = category._id;
  attributesInput.value = '';
  categoryNameError.textContent = '';
  categoryModal.style.display = 'flex';
  categoryName.focus();
}
function closeCategoryModal() {
  categoryModal.style.display = 'none';
  categoryName.value = '';
  attributesContainer.innerHTML = '';
  attributesInput.value = '';
  categoryNameError.textContent = '';
  categoryAttributeError.textContent = '';
  modalMode = 'add';
}

function addAttribute() {
  const attribute = attributesInput.value.trim();

  if (attribute === '') {
    return;
  }

  const normalize = (value) => value.trim().toLowerCase().replace(/\s+/g, '');

  const existingAttributes = Array.from(
    attributesContainer.querySelectorAll('.attribute-tag-modal span'),
  ).map((tag) => normalize(tag.textContent));

  if (existingAttributes.includes(normalize(attribute))) {
    categoryAttributeError.textContent = 'Attribute already created';
    return;
  }

  categoryAttributeError.textContent = '';

  createAttributeTag(attribute);

  attributesInput.value = '';
  attributesInput.focus();
}
attributesInput.addEventListener('input', function () {
  categoryAttributeError.textContent = '';
});
categoryName.addEventListener('input', function () {
  categoryNameError.textContent = '';
});
attributesInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    addAttribute();
  }
});
function createAttributeTag(attribute) {
  const tag = document.createElement('div');
  tag.classList.add('attribute-tag-modal');
  tag.innerHTML = `
        <span>${attribute}</span>
        <button type ="button" onclick ="removeAttributeTag(this)">×</button>
        `;
  attributesContainer.appendChild(tag);
}
function removeAttributeTag(button) {
  button.parentElement.remove();
}
categoryStatus.addEventListener('change', () => {
  if (categoryStatus.checked) {
    statusText.textContent = 'Listed(Visible to customers)';
  } else {
    statusText.textContent = 'Unlisted (Hidden from Customers)';
  }
});
function getAttributes() {
  const tags = attributesContainer.querySelectorAll('.attribute-tag-modal span');
  return Array.from(tags).map((tag) => tag.textContent.trim());
}
async function saveCategory() {
  const name = categoryName.value.trim();
  const isListed = categoryStatus.checked;
  const variantAttributes = getAttributes();

  categoryNameError.textContent = '';
  categoryMessage.textContent = '';

  if (name === '') {
    categoryNameError.textContent = 'Category name is required ';
    categoryName.focus();
    return;
  }
  if (name.length < 3) {
    categoryNameError.textContent = 'Category name should be atleast 3 letter';
    return;
  }
  if (!/^[a-zA-Z0-9]+(?:[ &'-][a-zA-Z0-9]+)*$/.test(name)) {
    categoryNameError.textContent =
      'Use only letters, numbers, spaces, hyphens, apostrophes, and &.';
    categoryName.focus();
    return;
  }
  const categoryData = {
    name,
    isListed,
    variantAttributes,
  };
  try {
    let response;
    if (modalMode === 'add') {
      response = await fetch('/admin/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(categoryData),
      });
    } else {
      console.log(editingCategoryId);
      response = await fetch(`/admin/categories/${editingCategoryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(categoryData),
      });
    }
    const result = await response.json();
    if (!response.ok) {
      categoryNameError.textContent = result.message;
      return;
    }
    showToastMessage(result.message, 'success');
    closeCategoryModal();
    setTimeout(() => {
      window.location.reload();
    }, 1400);
  } catch (error) {
    console.log(error);
    alert('somthing went wrong');
  }
}
const categoryMessage = document.getElementById('categoryMessage');
const message = sessionStorage.getItem('categoryMessage');
if (message) {
  categoryMessage.textContent = message;
  categoryMessage.classList.add('success');
  sessionStorage.removeItem('categoryMessage');
  setTimeout(() => {
    categoryMessage.style.display = 'none';
  }, 4000);
}

const categoryToggles = document.querySelectorAll('.category-status-toggle');
categoryToggles.forEach((toggle) => {
  toggle.addEventListener('change', function () {
    toggleCategoryStatus(this.dataset.categoryId, this);
  });
});
async function toggleCategoryStatus(categoryId, checkbox) {
  const isListed = checkbox.checked;
  try {
    const response = await fetch(`/admin/categories/${categoryId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ isListed }),
    });
    const result = await response.json();
    if (!response.ok) {
      checkbox.checked = !isListed;
      categoryMessage.textContent = result.message;
      categoryMessage.classList.add('error');
      return;
    }
    showToastMessage(result.message, 'success');
  } catch (error) {
    console.log(error);
    showToastMessage('Somthing went wrong', 'error');
  }
}

const deleteCategoryModal = document.getElementById('deleteCategoryModal');
const confirmCategoryDeleteBtn = document.getElementById('confirmCategoryDeleteBtn');
let deletingCategoryId = null;
function openDeleteModal(categoryId) {
  deletingCategoryId = categoryId;
  deleteCategoryModal.style.display = 'flex';
}
function closeDeleteModal() {
  deletingCategoryId = null;
  deleteCategoryModal.style.display = 'none';
}
confirmCategoryDeleteBtn.addEventListener('click', deleteCategory);
async function deleteCategory() {
  if (!deletingCategoryId) {
    return;
  }
  try {
    const response = await fetch(`/admin/categories/${deletingCategoryId}`, {
      method: 'DELETE',
    });
    const result = await response.json();
    if (!response.ok) {
      closeDeleteModal();
      categoryMessage.textContent = result.message;
      categoryMessage.classList.add('error');
      return;
    }
    showToastMessage(result.message, 'success');
    closeDeleteModal();
    setTimeout(() => {
      window.location.reload();
    }, 1400);
  } catch (error) {
    console.log(error);
    closeDeleteModal();
    showToastMessage('Somthing went wrong', 'error');
  }
}
