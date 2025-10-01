import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import {
  getMyItems,
  createItem,
  deleteItem,
  updateItem,
} from "../api/items";
import {
  createShopOwnerCoupon,
  updateShopOwnerCoupon,
  toggleShopOwnerCouponStatus,
  deleteShopOwnerCoupon,
  getShopOwnerCoupons,
} from "../api/coupons";
import API from "../api/axios";
import CouponsTable from "../pages/Coupons";

// ProductsTab component (same as before)
const ProductsTab = ({
  items,
  form,
  setForm,
  handleCreate,
  editItemId,
  editForm,
  startEdit,
  cancelEdit,
  handleEditChange,
  submitEdit,
  handleDelete
}) => (
  <div className="space-y-6">
    {/* Create Item Form */}
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Add New Product</h2>
      <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Product Title *</label>
          <input
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter product title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
          <input
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://example.com/image.jpg"
            value={form.imageUrl}
            onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹) *</label>
          <input
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0.00"
            type="number"
            step="0.01"
            min="0"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) })}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Stock *</label>
          <input
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0"
            type="number"
            min="0"
            value={form.stock}
            onChange={(e) => setForm({ ...form, stock: parseInt(e.target.value) })}
            required
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <input
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Product description"
            value={form.description}
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

    {/* Products List */}
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-900">My Products ({items.length})</h2>
        <p className="text-gray-600 text-sm">Manage your product inventory</p>
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
          {items.map((item) =>
            editItemId === item.id ? (
              // Edit Form
              <div key={item.id} className="p-6 bg-blue-50">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Product</h3>
                <form onSubmit={submitEdit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                    <input
                      name="title"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={editForm.title}
                      onChange={handleEditChange}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                    <input
                      name="imageUrl"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Image URL"
                      value={editForm.imageUrl}
                      onChange={handleEditChange}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹) *</label>
                    <input
                      name="price"
                      type="number"
                      step="0.01"
                      min="0"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={editForm.price}
                      onChange={handleEditChange}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stock *</label>
                    <input
                      name="stock"
                      type="number"
                      min="0"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={editForm.stock}
                      onChange={handleEditChange}
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <input
                      name="description"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={editForm.description}
                      onChange={handleEditChange}
                    />
                  </div>
                  <div className="md:col-span-2 flex gap-3">
                    <button
                      type="submit"
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      Save Changes
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              // Product Display
              <div key={item.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-4">
                  {item.image_url && (
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                        <p className="text-gray-600 mt-1">{item.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-gray-900">₹{item.price}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-sm font-medium ${item.low_stock_alert ? "text-red-600" : "text-gray-600"}`}>
                            Stock: {item.stock}
                          </span>
                          {item.low_stock_alert && (
                            <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                              ⚠ Low Stock
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="bg-red-100 text-red-700 hover:bg-red-200 px-3 py-1 rounded-lg text-sm font-medium transition-colors"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => startEdit(item)}
                        className="bg-blue-100 text-blue-700 hover:bg-blue-200 px-3 py-1 rounded-lg text-sm font-medium transition-colors"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  </div>
);

export default function ShopOwnerDashboard() {
  const { user } = useContext(AuthContext);
  const [items, setItems] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");

  // Sidebar and tab state
  const [activeTab, setActiveTab] = useState("products");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const tabs = [
    { id: "products", label: "My Products", icon: "📦" },
    { id: "coupons", label: "Coupons", icon: "🎫" },
  ];

  // Product form states and editing
  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    stock: 0,
    imageUrl: "",
  });
  const [editItemId, setEditItemId] = useState(null);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    price: "",
    stock: 0,
    imageUrl: "",
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (user.role === "ShopOwner") {
          const [itemsRes, couponsRes] = await Promise.all([
            getMyItems(),
            getShopOwnerCoupons(),
          ]);
          setItems(itemsRes.data);
          setCoupons(couponsRes.data);
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

  // Product handlers (unchanged)
  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        image_url: form.imageUrl,
      };
      delete payload.imageUrl;
      const res = await createItem(payload);
      setItems([...items, res.data]);
      setForm({ title: "", description: "", price: "", stock: 0, imageUrl: "" });
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
      const payload = { ...editForm, image_url: editForm.imageUrl };
      delete payload.imageUrl;
      await updateItem(editItemId, payload);
      setItems((prevItems) =>
        prevItems.map((item) =>
          item.id === editItemId ? { ...item, ...payload } : item
        )
      );
      cancelEdit();
      setErrMsg("");
    } catch (err) {
      console.error("Update failed:", err);
      setErrMsg("Failed to update item.");
    }
  };

  // Updated Coupon handlers
  const handleAddCoupon = async (couponData) => {
    try {
      const response = await createShopOwnerCoupon(couponData);
      setCoupons((prev) => [...prev, response.data]);
    } catch (err) {
      alert("Failed to create coupon");
      console.error(err);
    }
  };

  // Updated Coupon handlers
  const handleEditCoupon = (coupon) => {
    // Convert the coupon to the form format and set editing state
    const formattedCoupon = {
      ...coupon,
      start_at: coupon.start_at ? coupon.start_at.split('T')[0] : '',
      end_at: coupon.end_at ? coupon.end_at.split('T')[0] : '',
      min_order_amount: coupon.min_order_amount || '',
      max_uses: coupon.max_uses || '',
      discount_value: coupon.discount_value ? coupon.discount_value.toString() : '',
      // Ensure all required fields have values
      code: coupon.code || '',
      description: coupon.description || '',
      discount_type: coupon.discount_type || 'percentage',
      active: coupon.active !== undefined ? coupon.active : 1,
    };
    setEditingCoupon(formattedCoupon);
  };

  // NEW: Function to handle form field updates during editing
  const handleEditFormChange = (field, value) => {
    setEditingCoupon(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // NEW: Function to handle form submission for editing
  const handleEditSubmit = async (couponData) => {
    try {
      // Validate required fields
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
      setCoupons((prev) => prev.map((c) => (c.id === editingCoupon.id ? { ...c, ...response.data } : c)));
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
    switch (activeTab) {
      case "products":
        return (
          <ProductsTab
            items={items}
            form={form}
            setForm={setForm}
            handleCreate={handleCreate}
            editItemId={editItemId}
            editForm={editForm}
            startEdit={startEdit}
            cancelEdit={cancelEdit}
            handleEditChange={handleEditChange}
            submitEdit={submitEdit}
            handleDelete={handleDelete}
          />
        );
      case "coupons":
        return (
          <CouponsTable
            coupons={coupons}
            onAddCoupon={handleAddCoupon}
            onEditCoupon={handleEditCoupon} // This starts the edit mode
            onToggleCoupon={handleToggleCoupon}
            onDeleteCoupon={handleDeleteCoupon}
            loading={loading}
            error={errMsg}
            editingCoupon={editingCoupon}
            onCancelEdit={handleCancelEdit}
            onEditFormChange={handleEditFormChange} // Add this for field updates
            onEditSubmit={handleEditSubmit} // Add this for form submission
          />
        );
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
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 bg-white rounded-lg shadow-md border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          <span className="text-xl">☰</span>
        </button>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className={`
          fixed inset-y-0 left-0 z-40 bg-white shadow-xl transform transition-all duration-300 ease-in-out 
          lg:static lg:translate-x-0 lg:z-auto
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          ${sidebarCollapsed ? 'w-20' : 'w-64'}
        `}>
          <div className="flex flex-col h-full">
            {/* Header with integrated collapse button */}
            <div className={`p-4 border-b border-gray-200 ${sidebarCollapsed ? 'text-center' : 'flex items-center justify-between'}`}>
              {!sidebarCollapsed ? (
                <>
                  <div>
                    <h1 className="text-lg font-bold text-gray-900">My Shop</h1>
                    <p className="text-gray-600 text-xs mt-1">Business Dashboard</p>
                  </div>
                  <button
                    onClick={() => setSidebarCollapsed(true)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Collapse sidebar"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                    </svg>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setSidebarCollapsed(false)}
                  className="w-full p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Expand sidebar"
                >
                  <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                  </svg>
                </button>
              )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center px-2' : 'px-3'} py-3 rounded-lg text-left transition-colors ${activeTab === tab.id
                    ? "bg-blue-50 text-blue-700 border-r-2 border-blue-600"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    }`}
                  title={sidebarCollapsed ? tab.label : ''}
                >
                  <span className={`${sidebarCollapsed ? 'text-lg' : 'text-lg mr-3'}`}>{tab.icon}</span>
                  {!sidebarCollapsed && <span className="font-medium text-sm">{tab.label}</span>}
                </button>
              ))}
            </nav>

            {/* User info */}
            <div className="p-4 border-t border-gray-200">
              <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : ''}`}>
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                  <span className="text-green-600 text-sm font-medium">
                    {user?.username?.charAt(0).toUpperCase() || "S"}
                  </span>
                </div>
                {!sidebarCollapsed && (
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{user?.username}</p>
                    <p className="text-xs text-gray-500 truncate">Shop Owner</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="py-8 px-4 sm:px-6 lg:px-8">
            {/* Page header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">
                {tabs.find(tab => tab.id === activeTab)?.label || 'My Products'}
              </h1>
              <p className="text-gray-600 mt-2">
                {activeTab === 'products' && 'Manage your product inventory and stock levels'}
                {activeTab === 'coupons' && 'Create and manage discount codes for your shop'}
              </p>
            </div>

            {/* Tab Content */}
            {renderActiveTab()}
          </div>
        </div>
      </div>
    </div>
  );
}