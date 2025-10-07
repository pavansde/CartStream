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
  setEditForm,
  setForm,
  handleCreate,
  editItemId,
  editForm,
  startEdit,
  cancelEdit,
  handleEditChange,
  submitEdit,
  handleDelete,
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
        {/* <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
          <input
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://example.com/image.jpg"
            value={form.imageUrl}
            onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
          />
        </div> */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Upload Image
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setForm({ ...form, imageFile: e.target.files[0] })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Upload Image
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setEditForm({ ...editForm, imageFile: e.target.files[0] })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  <img
                    src={`http://localhost:8000${item.image_url}`}   // Add backend base URL here
                    alt={item.title}
                    className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                  />

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

  const [orders, setOrders] = useState([]);

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
          setOrders(ordersData); // Set the fixed data
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
    try {
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("description", form.description);
      formData.append("price", form.price);
      formData.append("stock", form.stock);

      if (form.imageFile) {
        formData.append("image", form.imageFile);  // Key "image" must match backend param
      }

      const res = await createItem(formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setItems([...items, res.data]);
      setForm({ title: "", description: "", price: "", stock: 0, imageFile: null });
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

    // Wait for API call to return updated item including image_url
    const res = await updateItem(editItemId, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    let updatedItem = { ...editForm };

    // Append timestamp to image_url to bust cache if imageFile was present (new image uploaded)
    if (editForm.imageFile && res.data.image_url) {
      updatedItem.image_url = `${res.data.image_url}?t=${new Date().getTime()}`;
    } else {
      updatedItem.image_url = editForm.imageUrl; // keep previous URL if no new image uploaded
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
      case "dashboard":  // Add this case
        return (
          <ShopOwnerDashboardStats
            items={items}
            orders={[orders]} // You'll need to fetch orders for dashboard - see note below
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
      case "profile":    // Render UserProfile for profile tab
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
