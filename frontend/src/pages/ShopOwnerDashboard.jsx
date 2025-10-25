import { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import {
  getMyItems,
  createItem,
  deleteItem,
  updateItem,
  createVariant,
  updateVariant,
  deleteVariant,
} from "../api/items";
import {
  getItemAttributes,
  addItemAttribute,
  updateItemAttribute,
  deleteItemAttribute,
} from "../api/item_attributes";
import {
  getCategories,
  getItemCategories,
  addCategoryToItem,
  removeCategoryFromItem,
} from "../api/categories";
import {
  createShopOwnerCoupon,
  updateShopOwnerCoupon,
  toggleShopOwnerCouponStatus,
  deleteShopOwnerCoupon,
  getShopOwnerCoupons,
} from "../api/coupons";
import CouponsTable from "../pages/Coupons";
import Sidebar from "../components/Sidebar";
import ShopOwnerOrders from "../pages/ShopOwnerOrders";
import UserProfile from "../components/UserProfile";
import ShopOwnerDashboardStats from "../components/ShopOwnerDashboardStats";
import { getShopOwnerOrders } from "../api/orders";
import { useToast } from "../context/ToastContext";

// Professional Category Selector Component
const CategorySelector = ({
  categories,
  selectedCategories,
  setSelectedCategories,
  label = "Categories",
  placeholder = "Select categories",
  required = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const sortedCategories = [...categories].sort((a, b) => a.name.localeCompare(b.name));

  const filteredCategories = sortedCategories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleCategory = (categoryId) => {
    setSelectedCategories(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  };

  const removeCategory = (categoryId, e) => {
    e.stopPropagation();
    setSelectedCategories(prev => prev.filter(id => id !== categoryId));
  };


  const getSelectedCategoryNames = () => {
    return selectedCategories
      .map(id => sortedCategories.find(cat => cat.id === id)?.name || "")
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b)); // Also sort selected tags alphabetically
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
        {selectedCategories.length > 0 && (
          <span className="text-blue-600 ml-2">({selectedCategories.length} selected)</span>
        )}
      </label>

      <div className="relative">
        {/* Selected categories display */}
        <div
          className="min-h-[42px] border border-gray-300 rounded-lg px-3 py-2 bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          onClick={() => setIsOpen(!isOpen)}
        >
          {selectedCategories.length === 0 ? (
            <span className="text-gray-500">{placeholder}</span>
          ) : (
            <div className="flex flex-wrap gap-2">
              {getSelectedCategoryNames().map((name, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {name}
                  <button
                    type="button"
                    className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full text-blue-400 hover:bg-blue-200 hover:text-blue-500 focus:outline-none"
                    onClick={(e) => removeCategory(selectedCategories[index], e)}
                  >
                    <span className="sr-only">Remove</span>
                    <svg className="h-3 w-3" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        </div>

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-lg border border-gray-200">
            {/* Search input */}
            <div className="p-2 border-b border-gray-200">
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Search categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            {/* Categories list */}
            <div className="max-h-60 overflow-y-auto">
              {filteredCategories.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-500">No categories found</div>
              ) : (
                filteredCategories.map(category => (
                  <div
                    key={category.id}
                    className="px-3 py-2 hover:bg-gray-50 cursor-pointer flex items-center"
                    onClick={() => toggleCategory(category.id)}
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                      checked={selectedCategories.includes(category.id)}
                      onChange={() => { }}
                    />
                    <span className="ml-3 text-sm text-gray-700">{category.name}</span>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="px-3 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
              Hold Ctrl/Cmd to select multiple categories
              {selectedCategories.length === 0 && (
                <span className="text-red-500"> - Please select at least one</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Product List Component
const ProductList = ({ items, onAddProduct, onViewProduct, onDeleteProduct }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900">My Products ({items.length})</h2>
          <p className="text-gray-600 text-sm">Manage your product inventory</p>
        </div>
        <button
          onClick={onAddProduct}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Add Product
        </button>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <span className="text-2xl">📦</span>
          </div>
          <p className="text-gray-500">No products found</p>
          <p className="text-gray-400 text-sm mt-1">Add your first product to get started</p>
          <button
            onClick={onAddProduct}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Add Your First Product
          </button>
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {items.map((item) => (
            <div key={item.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                    <p className="text-gray-600 text-sm">{item.description}</p>
                    {item.brand && <p className="text-gray-500 text-xs">Brand: {item.brand}</p>}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs">
                        {item.variants?.length || 0} variants
                      </span>
                      {item.categories?.length > 0 && (
                        <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs">
                          {item.categories.length} categories
                        </span>
                      )}
                      {item.low_stock_alert && (
                        <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">
                          Low Stock Alert
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onDeleteProduct(item.id)}
                    className="bg-red-100 text-red-700 hover:bg-red-200 px-3 py-1 rounded-lg text-sm font-medium transition-colors"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => onViewProduct(item)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Add Product Form Component
const AddProductForm = ({
  form,
  setForm,
  categories,
  selectedCategories,
  setSelectedCategories,
  newAttributes,
  setNewAttributes,
  isSubmitting,
  onSubmit,
  onCancel
}) => {
  const handleAddNewAttribute = () => {
    setNewAttributes([...newAttributes, { attribute_key: "", value: "" }]);
  };

  const handleRemoveNewAttribute = (index) => {
    const updated = [...newAttributes];
    updated.splice(index, 1);
    setNewAttributes(updated);
  };

  const handleNewAttributeChange = (index, field, value) => {
    const updated = [...newAttributes];
    if (!updated[index]) {
      updated[index] = { attribute_key: "", value: "" };
    }
    updated[index] = {
      ...updated[index],
      [field]: value
    };
    setNewAttributes(updated);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">Add New Product</h2>
        <button
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Product Title *</label>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Enter product title"
              value={form.title || ""}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Brand</label>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Brand"
              value={form.brand || ""}
              onChange={(e) => setForm({ ...form, brand: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <textarea
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            placeholder="Product description"
            value={form.description || ""}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>

        <CategorySelector
          categories={categories}
          selectedCategories={selectedCategories}
          setSelectedCategories={setSelectedCategories}
          required
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Attributes</label>
          <div className="space-y-3">
            {newAttributes.map((attr, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Key"
                  value={attr.attribute_key}
                  onChange={(e) => handleNewAttributeChange(index, "attribute_key", e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Value"
                    value={attr.value}
                    onChange={(e) => handleNewAttributeChange(index, "value", e.target.value)}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveNewAttribute(index)}
                    className="bg-red-100 text-red-700 hover:bg-red-200 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={handleAddNewAttribute}
            className="mt-3 bg-blue-100 text-blue-700 hover:bg-blue-200 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Add Attribute
          </button>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating Product...
              </>
            ) : (
              "Add Product"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

// Product Detail View Component
const ProductDetailView = ({
  item,
  categories,
  editingAttribute,
  setEditingAttribute,
  editAttributeForm,
  setEditAttributeForm,
  newAttributeForm,
  setNewAttributeForm,
  selectedCategoryForItem,
  setSelectedCategoryForItem,
  handleAddCategory,
  handleRemoveCategory,
  handleAddAttribute,
  handleUpdateAttribute,
  handleDeleteAttribute,
  cancelEditAttribute,
  handleCreateVariant,
  handleUpdateVariant,
  handleDeleteVariant,
  handleEditVariant,
  editingVariantId,
  editVariantForm,
  setEditVariantForm,
  cancelEditVariant,
  submitEditVariant,
  getVariantImages,
  apiBaseUrl,
  variantRowsByItemId,
  setVariantRowsByItemId,
  sharedImagesByItemId,
  setSharedImagesByItemId,
  submitCreateAllVariants,
  creatingForItem,
  onBack
}) => {
  const [variantFormByItemId, setVariantFormByItemId] = useState({});
  const [imagePreviews, setImagePreviews] = useState({});
  const { success, error } = useToast();

  // Helper function to safely extract data from the item
  const getCategories = (item) => {
    if (!item.categories) return [];
    if (Array.isArray(item.categories)) return item.categories;
    if (item.categories.data && Array.isArray(item.categories.data)) return item.categories.data;
    return [];
  };

  const getAttributes = (item) => {
    if (!item.attributes) return [];
    if (Array.isArray(item.attributes)) return item.attributes;
    if (item.attributes.data && Array.isArray(item.attributes.data)) return item.attributes.data;
    return [];
  };

  // Extract categories and attributes safely
  const itemCategories = getCategories(item);
  const itemAttributes = getAttributes(item);

  const emptyVariantRow = () => ({
    size: "",
    color: "",
    price: "",
    stock: "",
    imageFiles: [],
    previews: [],
    useSharedImages: false,
  });

  const getRows = (itemId) =>
    variantRowsByItemId[itemId] && variantRowsByItemId[itemId].length
      ? variantRowsByItemId[itemId]
      : [emptyVariantRow()];

  const setRows = (itemId, rows) =>
    setVariantRowsByItemId((prev) => ({ ...prev, [itemId]: rows }));

  const addVariantRow = (itemId) => {
    setRows(itemId, [...getRows(itemId), emptyVariantRow()]);
  };

  const removeVariantRow = (itemId, rowIdx) => {
    const rows = [...getRows(itemId)];
    rows[rowIdx]?.previews?.forEach((url) => URL.revokeObjectURL(url));
    rows.splice(rowIdx, 1);
    setRows(itemId, rows.length ? rows : [emptyVariantRow()]);
  };

  const onRowFieldChange = (itemId, rowIdx, field, value) => {
    const rows = [...getRows(itemId)];
    rows[rowIdx] = { ...rows[rowIdx], [field]: value };
    setRows(itemId, rows);
  };

  const toggleUseSharedImages = (itemId, rowIdx) => {
    const rows = [...getRows(itemId)];
    rows[rowIdx] = { ...rows[rowIdx], useSharedImages: !rows[rowIdx].useSharedImages };
    setRows(itemId, rows);
  };

  const onRowFilesAdd = (itemId, rowIdx, fileList) => {
    const files = Array.from(fileList || []);
    const rows = [...getRows(itemId)];
    const previews = files.map((f) => URL.createObjectURL(f));
    rows[rowIdx] = {
      ...rows[rowIdx],
      imageFiles: [...(rows[rowIdx].imageFiles || []), ...files],
      previews: [...(rows[rowIdx].previews || []), ...previews],
    };
    setRows(itemId, rows);
  };

  const onRowPreviewRemove = (itemId, rowIdx, imgIdx) => {
    const rows = [...getRows(itemId)];
    const previewUrl = rows[rowIdx]?.previews?.[imgIdx];
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    rows[rowIdx].previews = rows[rowIdx].previews.filter((_, i) => i !== imgIdx);
    rows[rowIdx].imageFiles = rows[rowIdx].imageFiles.filter((_, i) => i !== imgIdx);
    setRows(itemId, rows);
  };

  const addSharedFiles = (itemId, fileList) => {
    const files = Array.from(fileList || []);
    const previews = files.map((f) => URL.createObjectURL(f));
    setSharedImagesByItemId((prev) => {
      const existing = prev[itemId] || { files: [], previews: [] };
      return {
        ...prev,
        [itemId]: {
          files: [...existing.files, ...files],
          previews: [...existing.previews, ...previews],
        },
      };
    });
  };

  const removeSharedPreview = (itemId, imgIdx) => {
    setSharedImagesByItemId((prev) => {
      const bucket = prev[itemId] || { files: [], previews: [] };
      const url = bucket.previews[imgIdx];
      if (url) URL.revokeObjectURL(url);
      return {
        ...prev,
        [itemId]: {
          files: bucket.files.filter((_, i) => i !== imgIdx),
          previews: bucket.previews.filter((_, i) => i !== imgIdx),
        },
      };
    });
  };

  const clearSharedImages = (itemId) => {
    setSharedImagesByItemId((prev) => {
      const bucket = prev[itemId];
      if (bucket?.previews?.length) {
        bucket.previews.forEach((u) => URL.revokeObjectURL(u));
      }
      return { ...prev, [itemId]: { files: [], previews: [] } };
    });
  };

  const applySharedToAllRows = (itemId, value = true) => {
    const rows = [...getRows(itemId)].map((r) => ({ ...r, useSharedImages: value }));
    setRows(itemId, rows);
  };

  const clearAllRows = (itemId) => {
    const rows = getRows(itemId);
    rows.forEach((r) => r.previews?.forEach((u) => URL.revokeObjectURL(u)));
    setRows(itemId, [emptyVariantRow()]);
  };

  return (
    <div className="space-y-6">
      {/* Product Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <button
              onClick={onBack}
              className="flex items-center text-blue-600 hover:text-blue-800 mb-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Back to Products
            </button>
            <h2 className="text-2xl font-bold text-gray-900">{item.title}</h2>
            <p className="text-gray-600">{item.description}</p>
            {item.brand && <p className="text-gray-500 text-sm">Brand: {item.brand}</p>}
          </div>
          <div className="flex gap-2">
            <button className="bg-red-100 text-red-700 hover:bg-red-200 px-3 py-1 rounded-lg text-sm font-medium">
              Delete Product
            </button>
            <button className="bg-blue-100 text-blue-700 hover:bg-blue-200 px-3 py-1 rounded-lg text-sm font-medium">
              Edit Product
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-500">Variants</p>
            <p className="text-xl font-semibold">{item.variants?.length || 0}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-500">Categories</p>
            <p className="text-xl font-semibold">{itemCategories.length}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-500">Attributes</p>
            <p className="text-xl font-semibold">{itemAttributes.length}</p>
          </div>
        </div>
      </div>

      {/* Categories Section */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Categories</h3>
        {itemCategories.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {itemCategories.map(category => (
              <span key={category.id} className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm">
                {category.name}
                <button
                  onClick={() => handleRemoveCategory(item.id, category.id)}
                  className="ml-2 text-red-500 hover:text-red-700"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 italic text-sm">No categories assigned</p>
        )}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Add Category</label>
          <div className="flex">
            <select
              className="flex-1 border border-gray-300 rounded-l-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedCategoryForItem[item.id] || ""}
              onChange={(e) => setSelectedCategoryForItem(prev => ({ ...prev, [item.id]: parseInt(e.target.value) }))}
            >
              <option value="">Select a category</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
            <button
              onClick={() => handleAddCategory(item.id, selectedCategoryForItem[item.id])}
              disabled={!selectedCategoryForItem[item.id]}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-r-lg font-medium"
            >
              Add
            </button>
          </div>
        </div>
      </div>

      {/* Attributes Section */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Attributes</h3>
        {itemAttributes.length > 0 ? (
          <div className="space-y-2">
            {itemAttributes.map(attr => (
              <div key={attr.id} className="flex justify-between items-center bg-gray-50 p-3 rounded">
                <div>
                  <span className="font-medium">{attr.attribute_key}:</span> {attr.value}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingAttribute(attr)}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteAttribute(attr.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 italic text-sm">No attributes</p>
        )}

        {/* Edit Attribute Form */}
        {editingAttribute && editingAttribute.item_id === item.id && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h4 className="text-md font-medium text-gray-700 mb-3">Edit Attribute</h4>
            <form onSubmit={(e) => {
              e.preventDefault();
              handleUpdateAttribute(editingAttribute.id, editAttributeForm);
            }} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Key"
                  value={editAttributeForm.attribute_key}
                  onChange={(e) => setEditAttributeForm(prev => ({ ...prev, attribute_key: e.target.value }))}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <input
                  type="text"
                  placeholder="Value"
                  value={editAttributeForm.value}
                  onChange={(e) => setEditAttributeForm(prev => ({ ...prev, value: e.target.value }))}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={cancelEditAttribute}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="mt-4">
          <h4 className="text-md font-medium text-gray-700 mb-3">Add New Attribute</h4>
          <form onSubmit={(e) => {
            e.preventDefault();
            handleAddAttribute(item.id, newAttributeForm[item.id]);
          }} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Key"
                value={newAttributeForm[item.id]?.attribute_key || ""}
                onChange={(e) => {
                  setNewAttributeForm(prev => ({
                    ...prev,
                    [item.id]: {
                      ...prev[item.id],
                      attribute_key: e.target.value
                    }
                  }));
                }}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Value"
                value={newAttributeForm[item.id]?.value || ""}
                onChange={(e) => {
                  setNewAttributeForm(prev => ({
                    ...prev,
                    [item.id]: {
                      ...prev[item.id],
                      value: e.target.value
                    }
                  }));
                }}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium"
            >
              Add Attribute
            </button>
          </form>
        </div>
      </div>

      {/* Variants Section */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Product Variants ({item.variants?.length || 0})
          </h3>
          <button
            onClick={() => addVariantRow(item.id)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Add Variant
          </button>
        </div>

        {item.variants && item.variants.length > 0 ? (
          <div className="space-y-4">
            {item.variants.map((variant) => {
              const variantImages = getVariantImages(variant);
              const isLowStock = variant.stock !== null && variant.stock < 10;

              return (
                <div
                  key={variant.id}
                  className={`border rounded-lg p-4 ${isLowStock ? 'bg-red-50 border-red-200' : 'bg-gray-50'}`}
                >
                  {editingVariantId === variant.id ? (
                    // Edit Variant Form
                    <form onSubmit={(e) => submitEditVariant(e, variant.id)} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                        <input
                          type="text"
                          placeholder="Color"
                          value={editVariantForm.color || ""}
                          onChange={(e) => setEditVariantForm(prev => ({ ...prev, color: e.target.value }))}
                          className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="text"
                          placeholder="Size"
                          value={editVariantForm.size || ""}
                          onChange={(e) => setEditVariantForm(prev => ({ ...prev, size: e.target.value }))}
                          className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="number"
                          placeholder="Price"
                          step="0.01"
                          min="0"
                          value={editVariantForm.price || ""}
                          onChange={(e) => setEditVariantForm(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
                          className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                        <input
                          type="number"
                          placeholder="Stock"
                          min="0"
                          value={editVariantForm.stock || ""}
                          onChange={(e) => setEditVariantForm(prev => ({ ...prev, stock: parseInt(e.target.value) }))}
                          className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>

                      {/* Variant Images Display (Read-only during edit) */}
                      {variantImages.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm text-gray-600 mb-2">Current Images:</p>
                          <div className="flex flex-wrap gap-2">
                            {variantImages.map((imageUrl, imgIndex) => (
                              <div key={imgIndex} className="relative group">
                                <img
                                  src={`${apiBaseUrl}${imageUrl}`}
                                  alt={`Variant ${imgIndex + 1}`}
                                  className="w-16 h-16 object-cover rounded border"
                                />
                                {imgIndex === 0 && imageUrl === variant.image_url && (
                                  <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs px-1 rounded">
                                    Primary
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            Note: Image updates require creating a new variant
                          </p>
                        </div>
                      )}

                      <div className="flex gap-3">
                        <button
                          type="submit"
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium"
                        >
                          Save Changes
                        </button>
                        <button
                          type="button"
                          onClick={cancelEditVariant}
                          className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    // Variant Display
                    <>
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <p className="font-medium text-gray-900">
                              {variant.size && `Size: ${variant.size}`}
                              {variant.size && variant.color && ' • '}
                              {variant.color && `Color: ${variant.color}`}
                              {!variant.size && !variant.color && 'Default Variant'}
                            </p>
                            {isLowStock && (
                              <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">
                                Low Stock
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">
                            Price: ₹{variant.price?.toFixed(2) || '0.00'} • Stock: {variant.stock}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {variantImages.length} image{variantImages.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => handleEditVariant(variant)}
                            className="bg-blue-100 text-blue-700 hover:bg-blue-200 px-3 py-1 rounded text-sm font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteVariant(variant.id)}
                            className="bg-red-100 text-red-700 hover:bg-red-200 px-3 py-1 rounded text-sm font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      {/* Variant Images Display */}
                      {variantImages.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {variantImages.map((imageUrl, imgIndex) => (
                            <div key={imgIndex} className="relative group">
                              <img
                                src={`${apiBaseUrl}${imageUrl}`}
                                alt={`Variant ${imgIndex + 1}`}
                                className="w-16 h-16 object-cover rounded border"
                              />
                              {imgIndex === 0 && imageUrl === variant.image_url && (
                                <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs px-1 rounded">
                                  Primary
                                </span>
                              )}
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                                <span className="text-white text-xs bg-black bg-opacity-70 px-1 rounded">
                                  {imgIndex + 1}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-500 italic text-sm">No variants added yet</p>
        )}

        {/* Add Variant(s) with Images */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h4 className="text-md font-semibold mb-4 text-gray-800">Add New Variant(s)</h4>

          {/* Shared Images Pool */}
          <div className="mb-6 rounded-xl border border-gray-200 bg-white/70 p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-medium text-gray-900">Shared Images (optional)</p>
                <p className="text-xs text-gray-500">
                  Upload once and reuse across multiple variant rows by enabling "Use shared images".
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => applySharedToAllRows(item.id, true)}
                  className="text-sm px-3 py-1 rounded-lg border border-gray-300 hover:border-gray-400"
                >
                  Use for all rows
                </button>
                <button
                  type="button"
                  onClick={() => applySharedToAllRows(item.id, false)}
                  className="text-sm px-3 py-1 rounded-lg border border-gray-300 hover:border-gray-400"
                >
                  Disable for all
                </button>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <label className="text-sm text-gray-700">Images</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => addSharedFiles(item.id, e.target.files)}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
              <button
                type="button"
                onClick={() => clearSharedImages(item.id)}
                className="text-sm px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200"
              >
                Clear shared
              </button>
            </div>

            {/* Shared Previews */}
            {(sharedImagesByItemId[item.id]?.previews?.length || 0) > 0 && (
              <div className="mt-3">
                <p className="text-xs text-gray-600 mb-2">
                  Shared set: {sharedImagesByItemId[item.id].previews.length} image
                  {sharedImagesByItemId[item.id].previews.length !== 1 ? "s" : ""}
                </p>
                <div className="flex flex-wrap gap-2">
                  {sharedImagesByItemId[item.id].previews.map((url, sIdx) => (
                    <div key={sIdx} className="relative">
                      <img
                        src={url}
                        alt={`Shared ${sIdx + 1}`}
                        className="w-16 h-16 object-cover rounded border"
                      />
                      <button
                        type="button"
                        onClick={() => removeSharedPreview(item.id, sIdx)}
                        className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] hover:bg-red-700"
                        aria-label="Remove image"
                      >
                        ×
                      </button>
                      <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] text-center py-0.5 rounded-b">
                        {sIdx + 1}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Rows */}
          {getRows(item.id).map((row, idx) => {
            const shared = sharedImagesByItemId[item.id] || { files: [], previews: [] };
            const effectiveCount = (row.imageFiles?.length || 0) + (row.useSharedImages ? shared.files.length : 0);
            const rowValid = effectiveCount > 0 && row.price !== "" && !isNaN(Number(row.price)) && row.stock !== "" && !isNaN(Number(row.stock));

            return (
              <div key={`row-${idx}`} className="mb-4 rounded-xl border border-gray-200 bg-white/70 p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
                  <input
                    type="text"
                    placeholder="Color (optional)"
                    value={row.color}
                    onChange={(e) => onRowFieldChange(item.id, idx, "color", e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                  <input
                    type="text"
                    placeholder="Size (optional)"
                    value={row.size}
                    onChange={(e) => onRowFieldChange(item.id, idx, "size", e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                  <input
                    type="number"
                    placeholder="Price"
                    step="0.01"
                    min="0"
                    value={row.price}
                    onChange={(e) => onRowFieldChange(item.id, idx, "price", e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900"
                    required
                  />
                  <input
                    type="number"
                    placeholder="Stock"
                    min="0"
                    value={row.stock}
                    onChange={(e) => onRowFieldChange(item.id, idx, "stock", e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900"
                    required
                  />

                  {/* Per-row actions */}
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-700">Images</label>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => onRowFilesAdd(item.id, idx, e.target.files)}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900"
                    />
                  </div>

                  {/* Use shared images toggle */}
                  <div className="flex items-center gap-2">
                    <input
                      id={`use-shared-${item.id}-${idx}`}
                      type="checkbox"
                      checked={row.useSharedImages}
                      onChange={() => toggleUseSharedImages(item.id, idx)}
                      className="h-4 w-4"
                    />
                    <label
                      htmlFor={`use-shared-${item.id}-${idx}`}
                      className="text-sm text-gray-700"
                    >
                      Use shared images
                    </label>
                  </div>
                </div>

                {/* Previews (row + shared if enabled) */}
                {(row.previews?.length || 0) > 0 || (row.useSharedImages && (shared.previews?.length || 0) > 0) ? (
                  <div className="mt-3">
                    <p className="text-xs text-gray-600 mb-2">
                      Selected {effectiveCount} image{effectiveCount !== 1 ? "s" : ""}:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {/* Row-specific previews (removable) */}
                      {row.previews?.map((url, pIdx) => (
                        <div key={`row-prev-${pIdx}`} className="relative">
                          <img
                            src={url}
                            alt={`Preview ${pIdx + 1}`}
                            className="w-16 h-16 object-cover rounded border"
                          />
                          <button
                            type="button"
                            onClick={() => onRowPreviewRemove(item.id, idx, pIdx)}
                            className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] hover:bg-red-700"
                            aria-label="Remove image"
                          >
                            ×
                          </button>
                          <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] text-center py-0.5 rounded-b">
                            {pIdx + 1}
                          </div>
                        </div>
                      ))}

                      {/* Shared previews (read-only) */}
                      {row.useSharedImages && shared.previews?.map((url, sIdx) => (
                        <div key={`shared-prev-${sIdx}`} className="relative opacity-90" title="Shared image">
                          <img
                            src={url}
                            alt={`Shared ${sIdx + 1}`}
                            className="w-16 h-16 object-cover rounded border"
                          />
                          <div className="absolute -top-1 -right-1 bg-blue-600 text-white rounded-full px-1 h-5 flex items-center justify-center text-[10px]">
                            S
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] text-center py-0.5 rounded-b">
                            {sIdx + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {/* Remove row */}
                <div className="mt-3 flex justify-between">
                  <span className={`text-xs ${rowValid ? "text-emerald-600" : "text-gray-500"}`}>
                    {rowValid ? "Row ready" : "Add images (row or shared), price and stock to complete this row"}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeVariantRow(item.id, idx)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove row
                  </button>
                </div>
              </div>
            );
          })}

          {/* Footer actions */}
          <div className="flex items-center gap-3 mt-6">
            <button
              type="button"
              onClick={() => addVariantRow(item.id)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 bg-white hover:border-gray-400 text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add another variant
            </button>

            <button
              type="button"
              onClick={() => clearAllRows(item.id)}
              className="inline-flex items-center px-3 py-2 rounded-lg bg-gray-500 text-white hover:bg-gray-600 text-sm"
            >
              Clear all rows
            </button>

            <button
              onClick={(e) => submitCreateAllVariants(e, item.id)}
              disabled={creatingForItem === item.id}
              className="ml-auto inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-gray-400 text-sm font-semibold"
            >
              {creatingForItem === item.id ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white/70 border-t-transparent rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                "Create all variants"
              )}
            </button>
          </div>

          <p className="text-xs text-gray-500 mt-2">
            Note: Each row is created as a separate variant. If "Use shared images" is enabled, those images are attached to the row (and combined with any row-specific images if present).
          </p>
        </div>
      </div>
    </div>
  );
};
// ProductsTab component
const ProductsTab = ({
  items,
  form,
  setForm,
  handleCreate,
  editItemId,
  setEditForm,
  editForm,
  startEdit,
  cancelEdit,
  handleEditChange,
  submitEdit,
  handleDelete,
  handleCreateVariant,
  handleUpdateVariant,
  handleDeleteVariant,
  categories,
  handleAddCategory,
  handleRemoveCategory,
  handleAddAttribute,
  handleUpdateAttribute,
  handleDeleteAttribute,
  editingAttribute,
  setEditingAttribute,
  editAttributeForm,
  setEditAttributeForm,
  cancelEditAttribute,
  setNewAttributeForm,
  newAttributeForm,
  selectedCategoryForItem,
  setSelectedCategoryForItem,
  newAttributes,
  setNewAttributes,
  selectedCategories,
  setSelectedCategories,
  isSubmitting,
}) => {
  const [view, setView] = useState('list'); // 'list', 'add', 'view'
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [variantRowsByItemId, setVariantRowsByItemId] = useState({});
  const [sharedImagesByItemId, setSharedImagesByItemId] = useState({});
  const [creatingForItem, setCreatingForItem] = useState(null);
  const [editingVariantId, setEditingVariantId] = useState(null);
  const [editVariantForm, setEditVariantForm] = useState({});
  const { success, error } = useToast();
  const apiBaseUrl = process.env.REACT_APP_API_URL;

  const emptyVariantRow = () => ({
    size: "",
    color: "",
    price: "",
    stock: "",
    imageFiles: [],
    previews: [],
    useSharedImages: false,
  });

  const getRows = (itemId) =>
    variantRowsByItemId[itemId] && variantRowsByItemId[itemId].length
      ? variantRowsByItemId[itemId]
      : [emptyVariantRow()];

  const setRows = (itemId, rows) =>
    setVariantRowsByItemId((prev) => ({ ...prev, [itemId]: rows }));

  const addVariantRow = (itemId) => {
    setRows(itemId, [...getRows(itemId), emptyVariantRow()]);
  };

  const removeVariantRow = (itemId, rowIdx) => {
    const rows = [...getRows(itemId)];
    rows[rowIdx]?.previews?.forEach((url) => URL.revokeObjectURL(url));
    rows.splice(rowIdx, 1);
    setRows(itemId, rows.length ? rows : [emptyVariantRow()]);
  };

  const onRowFieldChange = (itemId, rowIdx, field, value) => {
    const rows = [...getRows(itemId)];
    rows[rowIdx] = { ...rows[rowIdx], [field]: value };
    setRows(itemId, rows);
  };

  const toggleUseSharedImages = (itemId, rowIdx) => {
    const rows = [...getRows(itemId)];
    rows[rowIdx] = { ...rows[rowIdx], useSharedImages: !rows[rowIdx].useSharedImages };
    setRows(itemId, rows);
  };

  const onRowFilesAdd = (itemId, rowIdx, fileList) => {
    const files = Array.from(fileList || []);
    const rows = [...getRows(itemId)];
    const previews = files.map((f) => URL.createObjectURL(f));
    rows[rowIdx] = {
      ...rows[rowIdx],
      imageFiles: [...(rows[rowIdx].imageFiles || []), ...files],
      previews: [...(rows[rowIdx].previews || []), ...previews],
    };
    setRows(itemId, rows);
  };

  const onRowPreviewRemove = (itemId, rowIdx, imgIdx) => {
    const rows = [...getRows(itemId)];
    const previewUrl = rows[rowIdx]?.previews?.[imgIdx];
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    rows[rowIdx].previews = rows[rowIdx].previews.filter((_, i) => i !== imgIdx);
    rows[rowIdx].imageFiles = rows[rowIdx].imageFiles.filter((_, i) => i !== imgIdx);
    setRows(itemId, rows);
  };

  const addSharedFiles = (itemId, fileList) => {
    const files = Array.from(fileList || []);
    const previews = files.map((f) => URL.createObjectURL(f));
    setSharedImagesByItemId((prev) => {
      const existing = prev[itemId] || { files: [], previews: [] };
      return {
        ...prev,
        [itemId]: {
          files: [...existing.files, ...files],
          previews: [...existing.previews, ...previews],
        },
      };
    });
  };

  const removeSharedPreview = (itemId, imgIdx) => {
    setSharedImagesByItemId((prev) => {
      const bucket = prev[itemId] || { files: [], previews: [] };
      const url = bucket.previews[imgIdx];
      if (url) URL.revokeObjectURL(url);
      return {
        ...prev,
        [itemId]: {
          files: bucket.files.filter((_, i) => i !== imgIdx),
          previews: bucket.previews.filter((_, i) => i !== imgIdx),
        },
      };
    });
  };

  const clearSharedImages = (itemId) => {
    setSharedImagesByItemId((prev) => {
      const bucket = prev[itemId];
      if (bucket?.previews?.length) {
        bucket.previews.forEach((u) => URL.revokeObjectURL(u));
      }
      return { ...prev, [itemId]: { files: [], previews: [] } };
    });
  };

  const applySharedToAllRows = (itemId, value = true) => {
    const rows = [...getRows(itemId)].map((r) => ({ ...r, useSharedImages: value }));
    setRows(itemId, rows);
  };

  const clearAllRows = (itemId) => {
    const rows = getRows(itemId);
    rows.forEach((r) => r.previews?.forEach((u) => URL.revokeObjectURL(u)));
    setRows(itemId, [emptyVariantRow()]);
  };

  const submitCreateAllVariants = async (e, itemId) => {
    e.preventDefault();
    const rows = getRows(itemId);
    const shared = sharedImagesByItemId[itemId] || { files: [], previews: [] };

    if (!rows.length) {
      error("Please add at least one variant row.");
      return;
    }

    // Basic validation: images (row or shared if toggled), price and stock
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const effectiveFiles = [
        ...(r.useSharedImages ? shared.files || [] : []),
        ...(r.imageFiles || []),
      ];
      if (!effectiveFiles.length) {
        error(`Row ${i + 1}: Add images or enable "Use shared images" with shared images uploaded.`);
        return;
      }
      if (r.price === "" || r.price === null || isNaN(Number(r.price))) {
        error(`Row ${i + 1}: Enter a valid price.`);
        return;
      }
      if (r.stock === "" || r.stock === null || isNaN(Number(r.stock))) {
        error(`Row ${i + 1}: Enter a valid stock quantity.`);
        return;
      }
    }

    setCreatingForItem(itemId);
    try {
      for (const r of rows) {
        const formData = new FormData();
        if (r.size) formData.append("size", r.size);
        if (r.color) formData.append("color", r.color);
        formData.append("price", r.price);
        formData.append("stock", r.stock);

        // Attach images (shared + row-specific if enabled)
        const effectiveFiles = [
          ...(r.useSharedImages ? shared.files || [] : []),
          ...(r.imageFiles || []),
        ];
        effectiveFiles.forEach((f) => formData.append("images", f));

        await handleCreateVariant(itemId, formData);
      }

      // clear per-row previews + reset rows (don't clear shared images so they can be reused)
      rows.forEach((r) => r.previews?.forEach((u) => URL.revokeObjectURL(u)));
      setRows(itemId, [emptyVariantRow()]);
      success(
        `${rows.length} variant${rows.length > 1 ? "s" : ""} created successfully!`
      );
    } catch (err) {
      console.error("Batch variant creation failed:", err);
      error("Failed to create variants.");
    } finally {
      setCreatingForItem(null);
    }
  };

  const startEditVariant = (variant) => {
    setEditingVariantId(variant.id);
    setEditVariantForm({
      size: variant.size || "",
      color: variant.color || "",
      price: variant.price || "",
      stock: variant.stock || "",
    });
  };

  const cancelEditVariant = () => {
    setEditingVariantId(null);
    setEditVariantForm({});
  };

  const submitEditVariant = async (e, variantId) => {
    e.preventDefault();
    try {
      await handleUpdateVariant(variantId, editVariantForm);
      setEditingVariantId(null);
      setEditVariantForm({});
      success("Variant updated successfully!");
    } catch (err) {
      console.error("Failed to update variant:", err);
      error("Failed to update variant");
    }
  };

  const getVariantImages = (variant) => {
    const images = [];
    if (variant.image_url) {
      images.push(variant.image_url);
    }

    if (variant.variant_images && Array.isArray(variant.variant_images)) {
      variant.variant_images.forEach((variantImage) => {
        if (
          variantImage.image_url &&
          !images.includes(variantImage.image_url)
        ) {
          images.push(variantImage.image_url);
        }
      });
    }

    return images;
  };

  const handleAddProduct = () => {
    setView('add');
  };

  const handleViewProduct = (product) => {
    // console.log('Selected product:', product)
    setSelectedProduct(product);
    setView('view');
  };

  const handleBackToList = () => {
    setView('list');
    setSelectedProduct(null);
  };

  // Cleanup previews when component unmounts
  useEffect(() => {
    return () => {
      // Revoke shared image previews
      Object.values(sharedImagesByItemId).forEach((bucket) => {
        bucket?.previews?.forEach((u) => URL.revokeObjectURL(u));
      });
      // Revoke row previews
      Object.values(variantRowsByItemId).forEach((rows) => {
        rows?.forEach((r) => r?.previews?.forEach((u) => URL.revokeObjectURL(u)));
      });
    };
  }, [sharedImagesByItemId, variantRowsByItemId]);

  if (view === 'add') {
    return (
      <AddProductForm
        form={form}
        setForm={setForm}
        categories={categories}
        selectedCategories={selectedCategories}
        setSelectedCategories={setSelectedCategories}
        newAttributes={newAttributes}
        setNewAttributes={setNewAttributes}
        isSubmitting={isSubmitting}
        onSubmit={handleCreate}
        onCancel={handleBackToList}
      />
    );
  }

  if (view === 'view' && selectedProduct) {
    return (
      <ProductDetailView
        item={selectedProduct}
        categories={categories}
        editingAttribute={editingAttribute}
        setEditingAttribute={setEditingAttribute}
        editAttributeForm={editAttributeForm}
        setEditAttributeForm={setEditAttributeForm}
        newAttributeForm={newAttributeForm}
        setNewAttributeForm={setNewAttributeForm}
        selectedCategoryForItem={selectedCategoryForItem}
        setSelectedCategoryForItem={setSelectedCategoryForItem}
        handleAddCategory={handleAddCategory}
        handleRemoveCategory={handleRemoveCategory}
        handleAddAttribute={handleAddAttribute}
        handleUpdateAttribute={handleUpdateAttribute}
        handleDeleteAttribute={handleDeleteAttribute}
        cancelEditAttribute={cancelEditAttribute}
        handleCreateVariant={handleCreateVariant}
        handleUpdateVariant={handleUpdateVariant}
        handleDeleteVariant={handleDeleteVariant}
        handleEditVariant={startEditVariant}
        editingVariantId={editingVariantId}
        editVariantForm={editVariantForm}
        setEditVariantForm={setEditVariantForm}
        cancelEditVariant={cancelEditVariant}
        submitEditVariant={submitEditVariant}
        getVariantImages={getVariantImages}
        apiBaseUrl={apiBaseUrl}
        variantRowsByItemId={variantRowsByItemId}
        setVariantRowsByItemId={setVariantRowsByItemId}
        sharedImagesByItemId={sharedImagesByItemId}
        setSharedImagesByItemId={setSharedImagesByItemId}
        submitCreateAllVariants={submitCreateAllVariants}
        creatingForItem={creatingForItem}
        onBack={handleBackToList}
        onDeleteProduct={handleDelete}
        startEdit={startEdit}
        cancelEdit={cancelEdit}
        handleEditChange={handleEditChange}
        submitEdit={submitEdit}
        editItemId={editItemId}
        editForm={editForm}
      />
    );
  }

  return (
    <ProductList
      items={items}
      onAddProduct={handleAddProduct}
      onViewProduct={handleViewProduct}
      onDeleteProduct={handleDelete}
    />
  );
};

export default function ShopOwnerDashboard() {
  const { user } = useContext(AuthContext);
  const { success, error } = useToast();
  const [items, setItems] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");
  const [orders, setOrders] = useState([]);
  const [variantLoading, setVariantLoading] = useState(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sidebar and tab state
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Attribute editing state
  const [editingAttribute, setEditingAttribute] = useState(null);
  const [editAttributeForm, setEditAttributeForm] = useState({ attribute_key: "", value: "" });
  const [newAttributeForm, setNewAttributeForm] = useState({});

  // Category selection state
  const [selectedCategoryForItem, setSelectedCategoryForItem] = useState({});

  // New item creation state
  const [newAttributes, setNewAttributes] = useState([{ attribute_key: "", value: "" }]);
  const [selectedCategories, setSelectedCategories] = useState([]);

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "products", label: "My Products", icon: "📦" },
    { id: "coupons", label: "Coupons", icon: "🎫" },
    { id: "profile", label: "Profile", icon: "👤" },
    { id: "orders", label: "My Orders", icon: "📦" },
  ];

  // Product form states and editing
  const [form, setForm] = useState({
    title: "",
    description: "",
    brand: "",
    imageFile: null,
  });
  const [editItemId, setEditItemId] = useState(null);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    brand: "",
    imageUrl: "",
  });
  // Coupon editing state
  const [editingCoupon, setEditingCoupon] = useState(null);

  const cancelEditAttribute = () => {
    setEditingAttribute(null);
    setEditAttributeForm({ attribute_key: "", value: "" });
  };

  const handleAddAttribute = async (itemId, attributeData) => {
    try {
      const response = await addItemAttribute(itemId, attributeData);
      const newAttribute = response.data;

      // Update items state with the new attribute
      setItems(prevItems =>
        prevItems.map(item =>
          item.id === itemId
            ? { ...item, attributes: [...(item.attributes || []), newAttribute] }
            : item
        )
      );

      // Reset form
      setNewAttributeForm(prev => ({ ...prev, [itemId]: { attribute_key: "", value: "" } }));
      success("Attribute added successfully!");
    } catch (err) {
      console.error("Add attribute failed:", err);
      error("Failed to add attribute");
    }
  };

  const handleUpdateAttribute = async (attributeId, attributeData) => {
    try {
      const response = await updateItemAttribute(attributeId, attributeData);
      const updatedAttribute = response.data;

      // Update items state with the updated attribute
      setItems(prevItems =>
        prevItems.map(item => ({
          ...item,
          attributes: item.attributes?.map(attr =>
            attr.id === attributeId ? updatedAttribute : attr
          ) || []
        }))
      );

      setEditingAttribute(null);
      setEditAttributeForm({ attribute_key: "", value: "" });
      success("Attribute updated successfully!");
    } catch (err) {
      console.error("Update attribute failed:", err);
      error("Failed to update attribute");
    }
  };

  const handleDeleteAttribute = async (attributeId) => {
    try {
      await deleteItemAttribute(attributeId);

      // Update items state by removing the deleted attribute
      setItems(prevItems =>
        prevItems.map(item => ({
          ...item,
          attributes: item.attributes?.filter(attr => attr.id !== attributeId) || []
        }))
      );

      success("Attribute deleted successfully!");
    } catch (err) {
      console.error("Delete attribute failed:", err);
      error("Failed to delete attribute");
    }
  };

  // Category handlers
  const handleAddCategory = async (itemId, categoryId) => {
    if (!categoryId) {
      error("Please select a category");
      return;
    }

    try {
      await addCategoryToItem(itemId, categoryId);

      // Find the category object from the categories list
      const category = categories.find(c => c.id === categoryId);
      if (category) {
        // Update items state with the new category
        setItems(prevItems =>
          prevItems.map(item =>
            item.id === itemId
              ? {
                ...item,
                categories: [...(item.categories || []), category]
              }
              : item
          )
        );
      }

      // Clear the selected category for this item
      setSelectedCategoryForItem(prev => ({ ...prev, [itemId]: null }));
      success("Category added successfully!");
    } catch (err) {
      console.error("Add category failed:", err);
      error("Failed to add category");
    }
  };

  const handleRemoveCategory = async (itemId, categoryId) => {
    try {
      await removeCategoryFromItem(itemId, categoryId);

      // Update items state by removing the category
      setItems(prevItems =>
        prevItems.map(item =>
          item.id === itemId
            ? {
              ...item,
              categories: item.categories?.filter(c => c.id !== categoryId) || []
            }
            : item
        )
      );

      success("Category removed successfully!");
    } catch (err) {
      console.error("Remove category failed:", err);
      error("Failed to remove category");
    }
  };

  // Variant handlers
  const handleCreateVariant = async (itemId, formData) => {
    setVariantLoading(prev => new Set(prev).add(`create-${itemId}`));
    try {
      // console.log("Creating variant for item:", itemId, formData);
      const response = await createVariant(itemId, formData);
      const newVariant = response.data;

      // Update items state with the new variant
      setItems(prevItems =>
        prevItems.map(item =>
          item.id === itemId
            ? { ...item, variants: [...(item.variants || []), newVariant] }
            : item
        )
      );

      success("Variant created successfully!");
    } catch (err) {
      console.error("Create variant failed:", err);
      error("Failed to create variant");
    } finally {
      setVariantLoading(prev => {
        const copy = new Set(prev);
        copy.delete(`create-${itemId}`);
        return copy;
      });
    }
  };

  const handleUpdateVariant = async (variantId, variantData) => {
    setVariantLoading(prev => new Set(prev).add(`update-${variantId}`));
    try {
      // console.log("Updating variant:", variantId, variantData);
      const response = await updateVariant(variantId, variantData);
      const updatedVariant = response.data;

      // Update items state with the updated variant
      setItems(prevItems =>
        prevItems.map(item => ({
          ...item,
          variants: item.variants?.map(variant =>
            variant.id === variantId ? { ...variant, ...updatedVariant } : variant
          ) || []
        }))
      );

      success("Variant updated successfully!");
    } catch (err) {
      console.error("Update variant failed:", err);
      error("Failed to update variant");
    } finally {
      setVariantLoading(prev => {
        const copy = new Set(prev);
        copy.delete(`update-${variantId}`);
        return copy;
      });
    }
  };

  const handleDeleteVariant = async (variantId) => {
    try {
      // console.log("Deleting variant:", variantId);
      await deleteVariant(variantId);

      // Update items state by removing the deleted variant
      setItems(prevItems =>
        prevItems.map(item => ({
          ...item,
          variants: item.variants?.filter(variant => variant.id !== variantId) || []
        }))
      );

      success("Variant deleted successfully!");
    } catch (err) {
      console.error("Delete variant failed:", err);
      error("Failed to delete variant");
    } finally {
      setVariantLoading(prev => {
        const copy = new Set(prev);
        copy.delete(`delete-${variantId}`);
        return copy;
      });
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (user.role === "ShopOwner") {
          const [itemsRes, couponsRes, ordersRes, categoriesRes] = await Promise.all([
            getMyItems(),
            getShopOwnerCoupons(),
            getShopOwnerOrders(),
            getCategories(),
          ]);

          // Process orders data
          let ordersData = ordersRes.data;
          if (Array.isArray(ordersData) && ordersData.length > 0 && Array.isArray(ordersData[0])) {
            ordersData = ordersData[0];
          }

          // console.log('Processed orders data:', ordersData);

          // Fetch categories and attributes for each item
          const itemsWithExtras = await Promise.all(itemsRes.data.map(async (item) => {
            const [itemCategories, itemAttributes] = await Promise.all([
              getItemCategories(item.id),
              getItemAttributes(item.id)
            ]);
            return { ...item, categories: itemCategories, attributes: itemAttributes };
          }));

          setItems(itemsWithExtras);
          setCoupons(couponsRes.data);
          setOrders(ordersData);
          setCategories(categoriesRes.data);
          setErrMsg("");
        }
      } catch (err) {
        console.error("Failed to fetch shop owner data:", err);
        setErrMsg("Failed to load your data.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const handleCreate = async (e) => {
    e.preventDefault();
    // console.log("form submitted");

    if (!form.title.trim()) {
      error("Please enter a product title");
      return;
    }

    if (selectedCategories.length === 0) {
      error("Please select at least one category");
      return;
    }

    try {
      setIsSubmitting(true);

      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("description", form.description);
      formData.append("brand", form.brand || "");

      // Log the categories we're about to add
      // console.log("Adding categories to FormData:", selectedCategories);

      // Send each category ID as a separate form field
      selectedCategories.forEach(id => {
        formData.append("category_ids", id);
        // console.log(`Added category_ids: ${id}`);
      });

      // Filter out empty attributes before sending
      const validAttributes = newAttributes.filter(attr =>
        attr.attribute_key !== "" && attr.value !== ""
      );

      // console.log("Valid attributes:", validAttributes);

      // Only send attributes if there are valid ones
      if (validAttributes.length > 0) {
        const attributesJson = JSON.stringify(validAttributes);
        formData.append("attributes", attributesJson);
        // console.log("Added attributes:", attributesJson);
      }

      if (form.imageFile) {
        formData.append("image", form.imageFile);
        // console.log("Added image file");
      }

      // Log all FormData entries
      // console.log("FormData entries:");
      for (let pair of formData.entries()) {
        // console.log(`${pair[0]}: ${pair[1]}`);
      }

      const res = await createItem(formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // console.log("Backend response:", res.data);

      // The response now includes categories and attributes
      const newItem = res.data;

      // Update items state
      setItems(prevItems => [...prevItems, newItem]);

      // Reset form
      setForm({
        title: "",
        description: "",
        brand: "",
        imageFile: null
      });
      setSelectedCategories([]);
      setNewAttributes([{ attribute_key: "", value: "" }]);

      // Show success message
      success("Product created successfully!");
      setErrMsg("");
    } catch (err) {
      console.error("Create item failed:", err);

      // Provide more specific error messages based on the error
      if (err.response) {
        // Server responded with error status
        const errorMsg = err.response.data?.detail || "Failed to create item.";
        setErrMsg(errorMsg);
        error(`Error: ${errorMsg}`);
      } else if (err.request) {
        // Request was made but no response received
        setErrMsg("Network error. Please check your connection.");
        error("Network error. Please check your connection.");
      } else {
        // Something else happened
        setErrMsg("Failed to create item.");
        error("Failed to create item.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteItem(id);
      setItems(items.filter((i) => i.id !== id));
      success("Product deleted successfully!");
    } catch (err) {
      console.error("Delete failed:", err);
      error("Failed to delete product");
    }
  };

  const startEdit = (item) => {
    setEditItemId(item.id);
    setEditForm({
      title: item.title,
      description: item.description,
      brand: item.brand || "",
      imageUrl: item.image_url || "",
    });
  };

  const cancelEdit = () => {
    setEditItemId(null);
    setEditForm({ title: "", description: "", brand: "", imageUrl: "" });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const submitEdit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("title", editForm.title);
      formData.append("description", editForm.description);
      formData.append("brand", editForm.brand);

      const res = await updateItem(editItemId, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      let updatedItem = { ...editForm };
      updatedItem.image_url = editForm.imageUrl;

      setItems((prevItems) =>
        prevItems.map((item) =>
          item.id === editItemId ? { ...item, ...updatedItem } : item
        )
      );
      cancelEdit();
      success("Product updated successfully!");
    } catch (err) {
      console.error("Update failed:", err);
      error("Failed to update product");
    }
  };

  // Coupon handlers
  const handleAddCoupon = async (couponData) => {
    try {
      const response = await createShopOwnerCoupon(couponData);
      setCoupons((prev) => [...prev, response.data]);
      success("Coupon created successfully!");
    } catch (err) {
      console.error(err);
      error("Failed to create coupon");
    }
  };

  const handleEditCoupon = (coupon) => {
    const formattedCoupon = {
      ...coupon,
      start_at: coupon.start_at ? coupon.start_at.split("T")[0] : "",
      end_at: coupon.end_at ? coupon.end_at.split("T")[0] : "",
      min_order_amount: coupon.min_order_amount || "",
      max_uses: coupon.max_uses || "",
      discount_value: coupon.discount_value ? coupon.discount_value.toString() : "",
      code: coupon.code || "",
      description: coupon.description || "",
      discount_type: coupon.discount_type || "percentage",
      active: coupon.active !== undefined ? coupon.active : 1,
    };
    setEditingCoupon(formattedCoupon);
  };

  const handleEditFormChange = (field, value) => {
    setEditingCoupon((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleEditSubmit = async (couponData) => {
    try {
      if (!couponData.code?.trim()) {
        error("Coupon code is required");
        return;
      }
      if (!couponData.discount_value || Number(couponData.discount_value) <= 0) {
        error("Discount value should be greater than zero");
        return;
      }

      const payload = {
        ...couponData,
        discount_value: parseFloat(couponData.discount_value),
        active: couponData.active ? 1 : 0,
        min_order_amount: couponData.min_order_amount ? parseFloat(couponData.min_order_amount) : 0,
        max_uses: couponData.max_uses ? parseInt(couponData.max_uses) : 0,
        start_at: couponData.start_at ? new Date(couponData.start_at).toISOString() : null,
        end_at: couponData.end_at ? new Date(couponData.end_at).toISOString() : null,
      };

      const response = await updateShopOwnerCoupon(editingCoupon.id, payload);
      setCoupons((prev) =>
        prev.map((c) => (c.id === editingCoupon.id ? { ...c, ...response.data } : c))
      );
      setEditingCoupon(null);
      success("Coupon updated successfully!");
    } catch (err) {
      console.error(err);
      error("Failed to update coupon");
    }
  };

  const handleCancelEdit = () => {
    setEditingCoupon(null);
  };

  const handleToggleCoupon = async (couponId) => {
    try {
      await toggleShopOwnerCouponStatus(couponId);
      setCoupons((prev) =>
        prev.map((c) => (c.id === couponId ? { ...c, active: !c.active } : c))
      );
      success("Coupon status updated successfully!");
    } catch (err) {
      console.error(err);
      error("Failed to toggle coupon status");
    }
  };

  const handleDeleteCoupon = async (couponId) => {
    try {
      await deleteShopOwnerCoupon(couponId);
      setCoupons((prev) => prev.filter((c) => c.id !== couponId));
      success("Coupon deleted successfully!");
    } catch (err) {
      console.error(err);
      error("Failed to delete coupon");
    }
  };

  // Render tabs content
  const renderActiveTab = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <ShopOwnerDashboardStats
            items={items}
            orders={[orders]}
            coupons={coupons}
          />
        );
      case "products":
        return (
          <ProductsTab
            items={items}
            form={form}
            setForm={setForm}
            handleCreate={handleCreate}
            editItemId={editItemId}
            setEditForm={setEditForm}
            editForm={editForm}
            startEdit={startEdit}
            cancelEdit={cancelEdit}
            handleEditChange={handleEditChange}
            submitEdit={submitEdit}
            handleDelete={handleDelete}
            handleCreateVariant={handleCreateVariant}
            handleUpdateVariant={handleUpdateVariant}
            handleDeleteVariant={handleDeleteVariant}
            categories={categories}
            handleAddCategory={handleAddCategory}
            handleRemoveCategory={handleRemoveCategory}
            handleAddAttribute={handleAddAttribute}
            handleUpdateAttribute={handleUpdateAttribute}
            handleDeleteAttribute={handleDeleteAttribute}
            editingAttribute={editingAttribute}
            setEditingAttribute={setEditingAttribute}
            editAttributeForm={editAttributeForm}
            setEditAttributeForm={setEditAttributeForm}
            cancelEditAttribute={cancelEditAttribute}
            newAttributeForm={newAttributeForm}
            setNewAttributeForm={setNewAttributeForm}
            selectedCategoryForItem={selectedCategoryForItem}
            setSelectedCategoryForItem={setSelectedCategoryForItem}
            newAttributes={newAttributes}
            setNewAttributes={setNewAttributes}
            selectedCategories={selectedCategories}
            setSelectedCategories={setSelectedCategories}
            isSubmitting={isSubmitting}
          />
        );
      case "coupons":
        return (
          <CouponsTable
            coupons={coupons}
            onAddCoupon={handleAddCoupon}
            onEditCoupon={handleEditCoupon}
            onToggleCoupon={handleToggleCoupon}
            onDeleteCoupon={handleDeleteCoupon}
            loading={loading}
            error={errMsg}
            editingCoupon={editingCoupon}
            onCancelEdit={handleCancelEdit}
            onEditFormChange={handleEditFormChange}
            onEditSubmit={handleEditSubmit}
          />
        );
      case "profile":
        return <UserProfile />;
      case "orders":
        return <ShopOwnerOrders orders={orders} />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (errMsg) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-sm p-8 text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <span className="text-2xl">⚠️</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error</h3>
          <p className="text-gray-600 mb-4">{errMsg}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <Sidebar
          title="My Shop"
          subtitle="Business Dashboard"
          tabs={tabs}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          sidebarCollapsed={sidebarCollapsed}
          setSidebarCollapsed={setSidebarCollapsed}
          user={user}
          userColor="green"
          userRoleLabel="Shop Owner"
        />
        <div className={`flex-1 min-w-0 transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
          <div className="py-8 px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">
                {tabs.find((tab) => tab.id === activeTab)?.label || "My Products"}
              </h1>
              <p className="text-gray-600 mt-2">
                {activeTab === "products" &&
                  "Manage your product inventory"}
                {activeTab === "coupons" &&
                  "Create and manage discount codes for your shop"}
              </p>
            </div>
            {renderActiveTab()}
          </div>
        </div>
      </div>
    </div>
  );
}