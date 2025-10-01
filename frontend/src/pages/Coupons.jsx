import React, { useState, useEffect } from "react";

// Reusable Coupon Form Component
    const CouponForm = ({ formData, onFormChange, onSubmit, onCancel, mode = "create" }) => (
        <div className="bg-white shadow-lg rounded-xl border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                    {mode === "create" ? "Create New Coupon" : "Edit Coupon"}
                </h3>
            </div>
            <form onSubmit={onSubmit} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Coupon Code *
                        </label>
                        <input
                            type="text"
                            value={formData.code}
                            onChange={(e) => onFormChange('code', e.target.value.toUpperCase())}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            placeholder="SUMMER25"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Discount Type *
                        </label>
                        <select
                            value={formData.discount_type}
                            onChange={(e) => onFormChange('discount_type', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        >
                            <option value="percentage">Percentage</option>
                            <option value="fixed">Fixed Amount</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Discount Value *
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.discount_value}
                            onChange={(e) => onFormChange('discount_value', e.target.value)}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            placeholder={formData.discount_type === "percentage" ? "25" : "100"}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Minimum Order Amount
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.min_order_amount}
                            onChange={(e) => onFormChange('min_order_amount', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            placeholder="0"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Maximum Uses
                        </label>
                        <input
                            type="number"
                            min="0"
                            value={formData.max_uses}
                            onChange={(e) => onFormChange('max_uses', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            placeholder="Unlimited"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Start Date
                        </label>
                        <input
                            type="date"
                            value={formData.start_at ? formData.start_at.split('T')[0] : ''}
                            onChange={(e) => onFormChange('start_at', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            End Date
                        </label>
                        <input
                            type="date"
                            value={formData.end_at ? formData.end_at.split('T')[0] : ''}
                            onChange={(e) => onFormChange('end_at', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Description
                        </label>
                        <input
                            type="text"
                            value={formData.description}
                            onChange={(e) => onFormChange('description', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            placeholder="Summer Sale Discount"
                        />
                    </div>
                </div>

                <div className="flex items-center">
                    <input
                        type="checkbox"
                        checked={!!formData.active}
                        onChange={(e) => onFormChange('active', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        id="activeCheckbox"
                    />
                    <label htmlFor="activeCheckbox" className="ml-2 block text-sm text-gray-900">
                        Activate coupon immediately
                    </label>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    >
                        {mode === "create" ? "Create Coupon" : "Update Coupon"}
                    </button>
                </div>
            </form>
        </div>
    );


export default function Coupons({
    coupons,
    onAddCoupon,
    onToggleCoupon,
    onEditCoupon,
    onDeleteCoupon,
    loading,
    error,
    editingCoupon,
    onCancelEdit,
    onEditFormChange, // Add this
    onEditSubmit,
}) {
    const [showAddForm, setShowAddForm] = useState(false);
    const [formData, setFormData] = useState({
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

    // Reset form when switching between add and edit modes
    useEffect(() => {
        if (editingCoupon) {
            setShowAddForm(false);
        }
    }, [editingCoupon]);

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!formData.code.trim()) {
            alert("Coupon code is required");
            return;
        }
        if (!formData.discount_value || Number(formData.discount_value) <= 0) {
            alert("Discount value should be greater than zero");
            return;
        }

        const payload = {
            ...formData,
            discount_value: parseFloat(formData.discount_value),
            active: formData.active ? 1 : 0,
            min_order_amount: formData.min_order_amount ? parseFloat(formData.min_order_amount) : 0,
            max_uses: formData.max_uses ? parseInt(formData.max_uses) : 0,
            start_at: formData.start_at ? new Date(formData.start_at).toISOString() : null,
            end_at: formData.end_at ? new Date(formData.end_at).toISOString() : null,
        };

        onAddCoupon(payload);
        setShowAddForm(false);
        setFormData({
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
    };



    if (loading) return (
        <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
    );

    if (error) return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
                <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                </div>
                <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Error loading coupons</h3>
                    <div className="mt-1 text-sm text-red-700">{error}</div>
                </div>
            </div>
        </div>
    );

    const getStatusBadge = (coupon) =>
        coupon.active ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <svg className="-ml-0.5 mr-1.5 h-2 w-2 text-green-400" fill="currentColor" viewBox="0 0 8 8">
                    <circle cx={4} cy={4} r={3} />
                </svg>
                Active
            </span>
        ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                <svg className="-ml-0.5 mr-1.5 h-2 w-2 text-gray-400" fill="currentColor" viewBox="0 0 8 8">
                    <circle cx={4} cy={4} r={3} />
                </svg>
                Inactive
            </span>
        );

    const getDiscountBadge = (coupon) => (
        <div className="flex flex-col">
            <span className={`font-semibold ${coupon.discount_type === "percentage" ? "text-green-600" : "text-blue-600"
                }`}>
                {coupon.discount_type === "percentage" ? `${coupon.discount_value}%` : `₹${coupon.discount_value}`}
            </span>
            {coupon.min_order_amount > 0 && (
                <span className="text-xs text-gray-500 mt-1">Min: ₹{coupon.min_order_amount}</span>
            )}
        </div>
    );

    

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Coupon Management</h1>
                    <p className="mt-1 text-sm text-gray-600">
                        Create and manage discount coupons for your customers
                    </p>
                </div>
                <button
                    onClick={() => setShowAddForm(true)}
                    disabled={!!editingCoupon}
                    className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Add Coupon
                </button>
            </div>

            {/* Add Coupon Form */}
            {showAddForm && (
                <CouponForm
                    formData={formData}
                    onFormChange={(field, value) => setFormData(prev => ({ ...prev, [field]: value }))}
                    onSubmit={handleSubmit}
                    onCancel={() => setShowAddForm(false)}
                    mode="create"
                />
            )}

            {/* Edit Coupon Form */}
            {editingCoupon && (
                <CouponForm
                    formData={editingCoupon}
                    onFormChange={onEditFormChange} // ✅ Correct function for field updates
                    onSubmit={(e) => {
                        e.preventDefault();
                        onEditSubmit(editingCoupon); // ✅ Correct function for submission
                    }}
                    onCancel={onCancelEdit}
                    mode="edit"
                />
            )}

            {/* Coupons Table */}
            <div className="bg-white shadow-lg rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">
                        All Coupons ({coupons.length})
                    </h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Code
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Description
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Discount
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Usage
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Expires
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {coupons.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center">
                                            <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                            </svg>
                                            <h4 className="text-lg font-medium text-gray-900 mb-1">No coupons found</h4>
                                            <p className="text-gray-500 mb-4">Get started by creating your first coupon</p>
                                            <button
                                                onClick={() => setShowAddForm(true)}
                                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                                            >
                                                Create Coupon
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                coupons.map((coupon) => (
                                    <tr key={coupon.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="font-mono font-semibold text-gray-900 bg-gray-100 px-2 py-1 rounded text-sm">
                                                {coupon.code}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900 max-w-xs truncate">
                                                {coupon.description || "No description"}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getDiscountBadge(coupon)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {coupon.used_count || 0}
                                                <span className="text-gray-500"> / {coupon.max_uses || "∞"}</span>
                                            </div>
                                            {coupon.max_uses > 0 && (
                                                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                                                    <div
                                                        className="bg-blue-600 h-1.5 rounded-full"
                                                        style={{
                                                            width: `${Math.min(100, ((coupon.used_count || 0) / coupon.max_uses) * 100)}%`
                                                        }}
                                                    ></div>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {coupon.end_at ? (
                                                <div>
                                                    {new Date(coupon.end_at).toLocaleDateString()}
                                                    {new Date(coupon.end_at) < new Date() && (
                                                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                                            Expired
                                                        </span>
                                                    )}
                                                </div>
                                            ) : (
                                                "No expiry"
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getStatusBadge(coupon)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => onToggleCoupon(coupon.id)}
                                                    className={`inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md ${coupon.active
                                                        ? "text-yellow-700 bg-yellow-100 hover:bg-yellow-200"
                                                        : "text-green-700 bg-green-100 hover:bg-green-200"
                                                        } transition-colors`}
                                                >
                                                    {coupon.active ? "Deactivate" : "Activate"}
                                                </button>
                                                <button
                                                    onClick={() => onEditCoupon(coupon)}
                                                    disabled={!!editingCoupon}
                                                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => onDeleteCoupon(coupon.id)}
                                                    disabled={!!editingCoupon}
                                                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}