import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import {
  getMyItems,
  createItem,
  deleteItem,
  updateItem,
  createVariant,
  updateVariant,
  deleteVariant
} from "../api/items";
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
}) => {
  const [variantFormByItemId, setVariantFormByItemId] = useState({});
  const [imagePreviews, setImagePreviews] = useState({});
  const [editingVariantId, setEditingVariantId] = useState(null);
  const [editVariantForm, setEditVariantForm] = useState({});

  const handleVariantFormChange = (itemId, field, value) => {
    setVariantFormByItemId((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], [field]: value },
    }));
  };

  const handleEditVariantFormChange = (field, value) => {
    setEditVariantForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleImageUpload = (itemId, files) => {
    const previews = Array.from(files).map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));

    setImagePreviews(prev => ({
      ...prev,
      [itemId]: [...(prev[itemId] || []), ...previews]
    }));

    setVariantFormByItemId(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        imageFiles: [...(prev[itemId]?.imageFiles || []), ...files]
      }
    }));
  };

  const removeImagePreview = (itemId, index) => {
    setImagePreviews(prev => ({
      ...prev,
      [itemId]: prev[itemId].filter((_, i) => i !== index)
    }));

    setVariantFormByItemId(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        imageFiles: prev[itemId]?.imageFiles?.filter((_, i) => i !== index) || []
      }
    }));
  };

  const submitVariantCreate = async (e, itemId) => {
    e.preventDefault();
    const vForm = variantFormByItemId[itemId];
    if (!vForm || !vForm.imageFiles || vForm.imageFiles.length === 0) return;

    try {
      const formData = new FormData();
      if (vForm.size) formData.append("size", vForm.size);
      if (vForm.color) formData.append("color", vForm.color);
      if (vForm.price !== undefined) formData.append("price", vForm.price);
      if (vForm.stock !== undefined) formData.append("stock", vForm.stock);

      vForm.imageFiles.forEach((file) => {
        formData.append("images", file);
      });

      await handleCreateVariant(itemId, formData);

      // Reset form and previews
      setVariantFormByItemId(prev => ({ ...prev, [itemId]: {} }));
      setImagePreviews(prev => ({ ...prev, [itemId]: [] }));

    } catch (error) {
      console.error("Failed to create variant:", error);
    }
  };

  const startEditVariant = (variant) => {
    setEditingVariantId(variant.id);
    setEditVariantForm({
      size: variant.size || "",
      color: variant.color || "",
      price: variant.price || "",
      stock: variant.stock || "",
      // Note: Image editing might require separate handling
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
    } catch (error) {
      console.error("Failed to update variant:", error);
    }
  };

  // Function to get all images for a variant
  const getVariantImages = (variant) => {
    const images = [];

    // Include primary image if exists
    if (variant.image_url) {
      images.push(variant.image_url);
    }

    // Include additional images from images array
    if (variant.images && Array.isArray(variant.images)) {
      variant.images.forEach(imageUrl => {
        if (imageUrl !== variant.image_url && !images.includes(imageUrl)) {
          images.push(imageUrl);
        }
      });
    }

    return images;
  };

  return (
    <div className="space-y-6">
      {/* Base Item Creation Form */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Add New Product</h2>
        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Product Title *</label>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter product title"
              value={form.title || ""}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Product description"
              value={form.description || ""}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Add Product
            </button>
          </div>
        </form>
      </div>

      {/* Product List */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">My Products ({items.length})</h2>
          <p className="text-gray-600 text-sm">Manage your product inventory and variants</p>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">📦</span>
            </div>
            <p className="text-gray-500">No products found</p>
            <p className="text-gray-400 text-sm mt-1">Add your first product above</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {items.map((item) => (
              <div key={item.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center text-gray-500 text-xs">
                      {item.image_url ? (
                        <img
                          src={`http://localhost:8000${item.image_url}`}
                          alt={item.title}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      ) : (
                        "No Image"
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                      <p className="text-gray-600 text-sm">{item.description}</p>
                      {item.low_stock_alert && (
                        <span className="inline-block mt-1 bg-red-100 text-red-800 text-xs px-2 py-1 rounded">
                          Low Stock Alert
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="bg-red-100 text-red-700 hover:bg-red-200 px-3 py-1 rounded-lg text-sm font-medium"
                    >
                      Delete Product
                    </button>
                    <button
                      onClick={() => startEdit(item)}
                      className="bg-blue-100 text-blue-700 hover:bg-blue-200 px-3 py-1 rounded-lg text-sm font-medium"
                    >
                      Edit Product
                    </button>
                  </div>
                </div>

                {/* Edit Form */}
                {editItemId === item.id && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <h4 className="text-md font-semibold mb-3">Edit Product</h4>
                    <form onSubmit={submitEdit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                        <input
                          name="title"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          value={editForm.title || ""}
                          onChange={handleEditChange}
                          required
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                          name="description"
                          rows={3}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          value={editForm.description || ""}
                          onChange={handleEditChange}
                        />
                      </div>
                      <div className="md:col-span-2 flex gap-3 mt-2">
                        <button
                          type="submit"
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium"
                        >
                          Save Changes
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Variants List */}
                <div className="ml-6 mb-4">
                  <h4 className="text-md font-semibold mb-3 text-gray-800">
                    Product Variants ({item.variants?.length || 0})
                  </h4>
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
                                    onChange={(e) => handleEditVariantFormChange("color", e.target.value)}
                                    className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                  <input
                                    type="text"
                                    placeholder="Size"
                                    value={editVariantForm.size || ""}
                                    onChange={(e) => handleEditVariantFormChange("size", e.target.value)}
                                    className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                  <input
                                    type="number"
                                    placeholder="Price"
                                    step="0.01"
                                    min="0"
                                    value={editVariantForm.price || ""}
                                    onChange={(e) => handleEditVariantFormChange("price", parseFloat(e.target.value))}
                                    className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                  />
                                  <input
                                    type="number"
                                    placeholder="Stock"
                                    min="0"
                                    value={editVariantForm.stock || ""}
                                    onChange={(e) => handleEditVariantFormChange("stock", parseInt(e.target.value))}
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
                                            src={`http://localhost:8000${imageUrl}`}
                                            alt={`Variant image ${imgIndex + 1}`}
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
                                      onClick={() => startEditVariant(variant)}
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
                                          src={`http://localhost:8000${imageUrl}`}
                                          alt={`Variant image ${imgIndex + 1}`}
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
                </div>

                {/* Add Variant/Image Form */}
                <div className="ml-6 border-t border-gray-300 pt-4">
                  <h5 className="text-md font-semibold mb-3 text-gray-800">Add New Variant with Images</h5>
                  <form
                    onSubmit={(e) => submitVariantCreate(e, item.id)}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                      <input
                        type="text"
                        placeholder="Color (optional)"
                        value={variantFormByItemId?.[item.id]?.color || ""}
                        onChange={(e) => handleVariantFormChange(item.id, "color", e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        placeholder="Size (optional)"
                        value={variantFormByItemId?.[item.id]?.size || ""}
                        onChange={(e) => handleVariantFormChange(item.id, "size", e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="number"
                        placeholder="Price"
                        step="0.01"
                        min="0"
                        value={variantFormByItemId?.[item.id]?.price ?? ""}
                        onChange={(e) => handleVariantFormChange(item.id, "price", parseFloat(e.target.value))}
                        className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                      <input
                        type="number"
                        placeholder="Stock"
                        min="0"
                        value={variantFormByItemId?.[item.id]?.stock ?? ""}
                        onChange={(e) => handleVariantFormChange(item.id, "stock", parseInt(e.target.value))}
                        className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    {/* Multiple Image Upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Upload Images (Multiple selection supported)
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => handleImageUpload(item.id, e.target.files)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />

                      {/* Image Previews */}
                      {imagePreviews[item.id]?.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm text-gray-600 mb-2">
                            Selected {imagePreviews[item.id].length} image{imagePreviews[item.id].length !== 1 ? 's' : ''}:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {imagePreviews[item.id].map((preview, index) => (
                              <div key={index} className="relative">
                                <img
                                  src={preview.preview}
                                  alt={`Preview ${index + 1}`}
                                  className="w-16 h-16 object-cover rounded border"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeImagePreview(item.id, index)}
                                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                                >
                                  ×
                                </button>
                                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs text-center py-0.5">
                                  {index + 1}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="submit"
                        disabled={!variantFormByItemId?.[item.id]?.imageFiles?.length}
                        className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-medium transition-colors"
                      >
                        Create Variant with {variantFormByItemId?.[item.id]?.imageFiles?.length || 0} Image{variantFormByItemId?.[item.id]?.imageFiles?.length !== 1 ? 's' : ''}
                      </button>

                      {/* Clear Form Button */}
                      {variantFormByItemId?.[item.id]?.imageFiles?.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setVariantFormByItemId(prev => ({ ...prev, [item.id]: {} }));
                            setImagePreviews(prev => ({ ...prev, [item.id]: [] }));
                          }}
                          className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                        >
                          Clear Form
                        </button>
                      )}
                    </div>

                    <p className="text-xs text-gray-500">
                      💡 All selected images will be uploaded as part of a single variant.
                      The first image will be set as the primary image.
                    </p>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default function ShopOwnerDashboard() {
  const { user } = useContext(AuthContext);
  const [items, setItems] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");
  const [variantFormByItemId, setVariantFormByItemId] = useState({});

  // Add missing state for variants
  const [variantsByItemId, setVariantsByItemId] = useState({});
  const [orders, setOrders] = useState([]);
  const [variantLoading, setVariantLoading] = useState(new Set());

  // Sidebar and tab state
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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
    price: "",
    stock: 0,
    imageUrl: "",
    imageFile: null,
  });
  const [editItemId, setEditItemId] = useState(null);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    price: "",
    stock: 0,
    imageUrl: "",
    imageFile: null,
  });
  // Coupon editing state
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [couponFormData, setCouponFormData] = useState({
    code: "",
    description: "",
    discount_type: "percentage",
    discount_value: "",
    active: 1,
    start_at: "",
    end_at: "",
    min_order_amount: "",
    max_uses: "",
  });

  // Add missing variant handlers with real API calls
  const handleCreateVariant = async (itemId, formData) => {
    setVariantLoading(prev => new Set(prev).add(`create-${itemId}`));
    try {
      console.log("Creating variant for item:", itemId, formData);
      const response = await createVariant(itemId, formData);
      const newVariant = response.data;

      // Update variants state
      setVariantsByItemId(prev => ({
        ...prev,
        [itemId]: [...(prev[itemId] || []), newVariant]
      }));

      setErrMsg("");
    } catch (err) {
      console.error("Create variant failed:", err);
      setErrMsg("Failed to create variant.");
    } finally {
      setVariantLoading(prev => {
        const copy = new Set(prev);
        copy.delete(`create-${itemId}`);
        return copy;
      });
    }
  };

  // In ShopOwnerDashboard - make sure this function exists
const handleUpdateVariant = async (variantId, variantData) => {
  setVariantLoading(prev => new Set(prev).add(`update-${variantId}`));
  try {
    console.log("Updating variant:", variantId, variantData);
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

    setErrMsg("");
  } catch (err) {
    console.error("Update variant failed:", err);
    setErrMsg("Failed to update variant.");
  } finally {
    setVariantLoading(prev => {
      const copy = new Set(prev);
      copy.delete(`update-${variantId}`);
      return copy;
    });
  }
};

  const handleDeleteVariant = async (variantId) => {
    if (!window.confirm("Delete this variant?")) return;
    setVariantLoading(prev => new Set(prev).add(`delete-${variantId}`));
    try {
      console.log("Deleting variant:", variantId);
      await deleteVariant(variantId);

      // Update variants state by removing the deleted variant
      setVariantsByItemId(prev => {
        const updated = { ...prev };
        for (const itemId in updated) {
          updated[itemId] = updated[itemId].filter(v => v.id !== variantId);
        }
        return updated;
      });

      setErrMsg("");
    } catch (err) {
      console.error("Delete variant failed:", err);
      setErrMsg("Failed to delete variant.");
    } finally {
      setVariantLoading(prev => {
        const copy = new Set(prev);
        copy.delete(`delete-${variantId}`);
        return copy;
      });
    }
  };

  // Function to fetch variants for a specific item
  const fetchVariantsForItem = async (itemId) => {
    try {
      // Since we don't have a getItemVariants API, we'll assume variants are included in the item response
      // If not, you'll need to create this API endpoint: GET /api/items/{item_id}/variants/
      console.log("Fetching variants for item:", itemId);
      // For now, we'll set empty array since variants might be included in the main items response
      return [];
    } catch (err) {
      console.error("Failed to fetch variants for item:", itemId, err);
      return [];
    }
  };

  // Add this function to fetch variants for all items
  const fetchVariantsForItems = async (items) => {
    try {
      const variantsMap = {};

      // Fetch variants for each item
      for (const item of items) {
        const variants = await fetchVariantsForItem(item.id);
        variantsMap[item.id] = variants;
      }

      setVariantsByItemId(variantsMap);
    } catch (err) {
      console.error("Failed to fetch variants:", err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (user.role === "ShopOwner") {
          const [itemsRes, couponsRes, ordersRes] = await Promise.all([
            getMyItems(),
            getShopOwnerCoupons(),
            getShopOwnerOrders(),
          ]);

          // FIX: Handle nested array structure
          let ordersData = ordersRes.data;
          if (Array.isArray(ordersData) && ordersData.length > 0 && Array.isArray(ordersData[0])) {
            ordersData = ordersData[0];
          }

          console.log('Processed orders data:', ordersData);

          setItems(itemsRes.data);
          setCoupons(couponsRes.data);
          setOrders(ordersData);
          setErrMsg("");

          // Fetch variants for each item
          await fetchVariantsForItems(itemsRes.data);
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
    try {
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("description", form.description);
      formData.append("price", form.price);
      formData.append("stock", form.stock);

      if (form.imageFile) {
        formData.append("image", form.imageFile);
      }

      const res = await createItem(formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setItems([...items, res.data]);
      setForm({ title: "", description: "", price: "", stock: 0, imageFile: null });

      // Initialize variants for the new item
      setVariantsByItemId(prev => ({
        ...prev,
        [res.data.id]: []
      }));

      setErrMsg("");
    } catch (err) {
      console.error("Create item failed:", err);
      setErrMsg("Failed to create item.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this item?")) return;
    try {
      await deleteItem(id);
      setItems(items.filter((i) => i.id !== id));

      // Remove variants for deleted item
      setVariantsByItemId(prev => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });
    } catch (err) {
      console.error("Delete failed:", err);
      setErrMsg("Failed to delete item.");
    }
  };

  const startEdit = (item) => {
    setEditItemId(item.id);
    setEditForm({
      title: item.title,
      description: item.description,
      price: item.price,
      stock: item.stock,
      imageUrl: item.image_url || "",
      imageFile: null,
    });
  };

  const cancelEdit = () => {
    setEditItemId(null);
    setEditForm({ title: "", description: "", price: "", stock: 0, imageUrl: "" });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: name === "price" || name === "stock" ? Number(value) : value,
    }));
  };

  const submitEdit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("title", editForm.title);
      formData.append("description", editForm.description);
      formData.append("price", editForm.price);
      formData.append("stock", editForm.stock);

      if (editForm.imageFile) {
        formData.append("image", editForm.imageFile);
      }

      const res = await updateItem(editItemId, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      let updatedItem = { ...editForm };

      if (editForm.imageFile && res.data.image_url) {
        updatedItem.image_url = `${res.data.image_url}?t=${new Date().getTime()}`;
      } else {
        updatedItem.image_url = editForm.imageUrl;
      }

      setItems((prevItems) =>
        prevItems.map((item) =>
          item.id === editItemId ? { ...item, ...updatedItem } : item
        )
      );
      cancelEdit();
      setErrMsg("");
    } catch (err) {
      console.error("Update failed:", err);
      setErrMsg("Failed to update item.");
    }
  };

  // Coupon handlers
  const handleAddCoupon = async (couponData) => {
    try {
      const response = await createShopOwnerCoupon(couponData);
      setCoupons((prev) => [...prev, response.data]);
    } catch (err) {
      alert("Failed to create coupon");
      console.error(err);
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
        alert("Coupon code is required");
        return;
      }
      if (!couponData.discount_value || Number(couponData.discount_value) <= 0) {
        alert("Discount value should be greater than zero");
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
    } catch (err) {
      alert("Failed to update coupon");
      console.error(err);
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
    } catch (err) {
      alert("Failed to toggle coupon");
      console.error(err);
    }
  };

  const handleDeleteCoupon = async (couponId) => {
    if (!window.confirm("Are you sure you want to delete this coupon?")) return;
    try {
      await deleteShopOwnerCoupon(couponId);
      setCoupons((prev) => prev.filter((c) => c.id !== couponId));
    } catch (err) {
      alert("Failed to delete coupon");
      console.error(err);
    }
  };

  // Render tabs content
  const renderActiveTab = () => {
    console.log('Dashboard orders state:', orders);
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
                  "Manage your product inventory and stock levels"}
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