// src/pages/CategoriesManager.js
import React, { useEffect, useState } from 'react';
import { getCategories, createCategory } from '../api/categories';

const CategoriesManager = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newCategory, setNewCategory] = useState({ 
    name: '', 
    description: '',
    parent_id: null 
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
  try {
    const response = await getCategories();
    setCategories(response.data);
    setLoading(false);
  } catch (err) {
    console.error('Failed to fetch categories:', err);
    setError('Failed to load categories');
    setLoading(false);
  }
};

const handleSubmit = async (e) => {
  e.preventDefault();
  if (!newCategory.name.trim()) {
    setError('Category name is required');
    return;
  }

  try {
    await createCategory(newCategory);
    setNewCategory({ name: '', description: '', parent_id: null });
    fetchCategories(); // Refresh the list
    setError('');
    setSuccess('Category created successfully!');
    // Clear success message after 3 seconds
    setTimeout(() => setSuccess(''), 3000);
  } catch (err) {
    console.error('Failed to create category:', err);
    setError('Failed to create category');
    setSuccess('');
  }
};

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewCategory(prev => ({ ...prev, [name]: value }));
  };

  const buildCategoryTree = (categories, parentId = null) => {
    return categories
      .filter(category => category.parent_id === parentId)
      .map(category => ({
        ...category,
        children: buildCategoryTree(categories, category.id)
      }));
  };

  const renderCategoryTree = (categories, level = 0) => {
    return categories.map(category => (
      <div key={category.id} className={`ml-${level * 4} mb-2`}>
        <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
          <div>
            <div className="font-medium text-gray-900">{category.name}</div>
            {category.description && (
              <div className="text-sm text-gray-600">{category.description}</div>
            )}
            {category.parent_id && (
              <div className="text-xs text-gray-500">Parent ID: {category.parent_id}</div>
            )}
          </div>
          <div className="text-sm text-gray-500">
            ID: {category.id}
          </div>
        </div>
        {category.children && category.children.length > 0 && (
          <div className="mt-2">
            {renderCategoryTree(category.children, level + 1)}
          </div>
        )}
      </div>
    ));
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-32 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-3 bg-gray-200 rounded w-full"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const categoryTree = buildCategoryTree(categories);

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-900">Categories Management</h2>
        <p className="text-gray-600 text-sm">Create and manage product categories</p>
      </div>
      
      {success && (
        <div className="px-6 py-3 bg-green-50 text-green-700">
          {success}
        </div>
      )}
      
      {error && (
        <div className="px-6 py-3 bg-red-50 text-red-700">
          {error}
        </div>
      )}
      
      <div className="p-6">
        <form onSubmit={handleSubmit} className="mb-8 max-w-2xl">
          <h3 className="text-lg font-semibold mb-4">Create New Category</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category Name *</label>
              <input
                type="text"
                name="name"
                value={newCategory.name}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter category name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input
                type="text"
                name="description"
                value={newCategory.description}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter category description"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Parent Category</label>
              <select
                name="parent_id"
                value={newCategory.parent_id || ''}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">None (Root Category)</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Create Category
            </button>
          </div>
        </form>
        
        <div>
          <h3 className="text-lg font-semibold mb-4">Existing Categories</h3>
          {categories.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">🏷️</span>
              </div>
              <p className="text-gray-500">No categories found</p>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-4">
              {renderCategoryTree(categoryTree)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoriesManager;