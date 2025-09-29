import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import {
  getMyItems,
  createItem,
  deleteItem,
  updateItem,
} from "../api/items";

export default function ShopOwnerDashboard() {
  const { user } = useContext(AuthContext);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");

  // Form for adding new item
  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    stock: 0,
    imageUrl: ""
  });

  // State for tracking item currently being edited and its form data
  const [editItemId, setEditItemId] = useState(null);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    price: "",
    stock: 0,
    imageUrl: ""
  });

  useEffect(() => {
    const fetchItems = async () => {
      if (user.role === "ShopOwner") {
        try {
          const res = await getMyItems();
          setItems(res.data);
          setErrMsg("");
        } catch (err) {
          console.error("Failed to fetch shop owner items:", err);
          setErrMsg("Failed to load your products.");
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    fetchItems();
  }, [user]);

  // Create a new item handler
  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        image_url: form.imageUrl, // map camelCase to snake_case
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


  // Delete item handler
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

  // Start editing an item
  const startEdit = (item) => {
  setEditItemId(item.id);
  setEditForm({
    title: item.title,
    description: item.description,
    price: item.price,
    stock: item.stock,
    imageUrl: item.image_url || "",  // <-- map snake_case to camelCase
  });
};


  // Cancel editing
  const cancelEdit = () => {
    setEditItemId(null);
    setEditForm({ title: "", description: "", price: "", stock: 0 });
  };

  // Handle form field changes during edit
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: name === "price" || name === "stock" ? Number(value) : value,
    }));
  };

  // Submit edit updates
  const submitEdit = async (e) => {
  e.preventDefault();
  try {
    const payload = {
      ...editForm,
      image_url: editForm.imageUrl, // map camelCase to snake_case
    };
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


  if (loading) {
    return (
      <div className="p-6 text-center text-gray-600 font-semibold">
        Loading products...
      </div>
    );
  }

  if (errMsg) {
    return (
      <div className="p-6 text-center text-red-500 font-semibold">{errMsg}</div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="font-bold text-lg mb-4">Manage My Products</h1>

      {/* Create Item Form */}
      <form onSubmit={handleCreate} className="mb-6 flex flex-wrap gap-2">
        <input
          className="border p-2"
          placeholder="Title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
        />
        <input
          className="border p-2 flex-1"
          placeholder="Image URL"
          value={form.imageUrl}
          onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
        />

        <input
          className="border p-2"
          placeholder="Price"
          type="number"
          step="0.01"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) })}
          required
        />
        <input
          className="border p-2"
          placeholder="Stock"
          type="number"
          value={form.stock}
          onChange={(e) => setForm({ ...form, stock: parseInt(e.target.value) })}
          required
        />
        <input
          className="border p-2 flex-1"
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2">
          Add Item
        </button>
      </form>

      {/* Items List */}
      {items.length === 0 ? (
        <p>No products found.</p>
      ) : (
        items.map((item) =>
          editItemId === item.id ? (
            // Edit form for item
            <form
              key={item.id}
              onSubmit={submitEdit}
              className="border p-4 mb-2 flex flex-wrap gap-2 items-center"
            >
              <input
                name="title"
                className="border p-2 flex-1"
                value={editForm.title}
                onChange={handleEditChange}
                required
              />
              <input
                name="imageUrl"
                className="border p-2 flex-1"
                placeholder="Image URL"
                value={editForm.imageUrl}
                onChange={handleEditChange}
              />

              <input
                name="price"
                type="number"
                step="0.01"
                className="border p-2 w-24"
                value={editForm.price}
                onChange={handleEditChange}
                required
              />
              <input
                name="stock"
                type="number"
                className="border p-2 w-20"
                value={editForm.stock}
                onChange={handleEditChange}
                required
              />
              <input
                name="description"
                className="border p-2 flex-1"
                value={editForm.description}
                onChange={handleEditChange}
              />
              <button
                type="submit"
                className="bg-green-600 text-white px-4 py-2 rounded"
              >
                Save
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                className="bg-gray-400 text-white px-4 py-2 rounded"
              >
                Cancel
              </button>
            </form>
          ) : (
            // Normal display of item
            <div
              key={item.id}
              className="border p-4 mb-2 flex justify-between items-center"
            >
              <div>
                {item.imageUrl && (
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-24 h-24 object-cover rounded mr-4 mb-2"
                  />
                )}
                <h2 className="font-semibold">{item.title}</h2>
                <p>₹{item.price}</p>
                <p>
                  Stock:{" "}
                  <span className={item.low_stock_alert ? "text-red-600 font-bold" : ""}>
                    {item.stock}
                  </span>
                  {item.low_stock_alert && (
                    <span className="ml-2 text-sm bg-red-100 text-red-800 px-2 py-1 rounded">
                      ⚠ Low Stock
                    </span>
                  )}
                </p>
              </div>
              <div>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="bg-red-500 text-white px-3 py-1 mr-2"
                >
                  Delete
                </button>
                <button
                  onClick={() => startEdit(item)}
                  className="bg-yellow-500 text-white px-3 py-1"
                >
                  Edit
                </button>
              </div>
            </div>
          )
        )
      )}
    </div>
  );
}
