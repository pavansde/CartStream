import React, { useState, useEffect } from "react";
import {
    getCurrentUser,
    updateCurrentUser,
    getUserProfile,
    updateUserProfile,
    changePassword,
} from "../api/User";

import {
    getUserAddresses,
    createUserAddress,
    updateUserAddress,
    deleteUserAddress,
} from "../api/addresses";

export default function UserProfile({ authToken }) {
    // State for user info and addresses
    const [userInfo, setUserInfo] = useState({
        fullName: "",
        email: "",
        profilePicture: "",
        contactNumber: "",
        profilePictureFile: null,
        dateOfBirth: "",
        bio: "",
    });

    const [passwordForm, setPasswordForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
    });
    const [editingAddressId, setEditingAddressId] = useState(null);
    const [addresses, setAddresses] = useState([]);
    const [addressErrors, setAddressErrors] = useState({});

    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });
    const [activeTab, setActiveTab] = useState("profile");

    const [imageTimestamp, setImageTimestamp] = useState(Date.now());


    // Fetch user profile and addresses on component mount
    useEffect(() => {
        async function fetchData() {
            setIsLoading(true);
            try {
                const userResp = await getUserProfile(authToken);
                setUserInfo({
                    fullName: userResp.data.fullName || "",
                    email: userResp.data.email || "",
                    profilePicture: userResp.data.profilePicture || "",
                    contactNumber: userResp.data.contactNumber || "",
                    dateOfBirth: userResp.data.dateOfBirth || "",
                    bio: userResp.data.bio || "",
                });

                const addrResp = await getUserAddresses();
                setAddresses(
                    addrResp.data.length > 0
                        ? addrResp.data.map((a) => ({
                            id: a.id,
                            label: a.label || "",
                            addressLine: a.address_line1 || "",
                            addressLine2: a.address_line2 || "",
                            city: a.city || "",
                            state: a.state || "",
                            postalCode: a.postal_code || "",
                            country: a.country || "",
                            phone: a.phone || "",
                            fullName: a.full_name || "",
                            isDefault: a.is_default || false
                        }))
                        : []
                );
            } catch (error) {
                setMessage({ type: "error", text: "Failed to load user data" });
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, [authToken]);

    const handleUserInfoChange = (e) => {
        const { name, value, type, files } = e.target;
        if (type === "file") {
            const file = files[0];
            setUserInfo(prev => ({
                ...prev,
                [name]: file,
                [`${name}Preview`]: file ? URL.createObjectURL(file) : null
            }));
        } else {
            setUserInfo(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };


    // Password form handlers
    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordForm((prev) => ({ ...prev, [name]: value }));
    };

    const submitUserInfo = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const formData = new FormData();
            formData.append("fullName", userInfo.fullName);
            formData.append("email", userInfo.email);
            formData.append("contactNumber", userInfo.contactNumber);
            formData.append("dateOfBirth", userInfo.dateOfBirth);
            formData.append("bio", userInfo.bio);
            if (userInfo.profilePictureFile) {
                formData.append("image", userInfo.profilePictureFile);
            }

            const res = await updateUserProfile(formData, authToken, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            setMessage({ type: "success", text: "Profile updated successfully" });

            if (userInfo.profilePictureFile && res.data.profilePicture) {
                setUserInfo(prev => ({
                    ...prev,
                    profilePicture: `${res.data.profilePicture}?t=${Date.now()}`,
                }));
            }

        } catch (error) {
            setMessage({ type: "error", text: "Failed to update profile" });
        } finally {
            setIsLoading(false);
        }
    };



    // Submit password change to API
    const submitPasswordChange = async (e) => {
        e.preventDefault();
        if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
            setMessage({ type: "error", text: "New passwords do not match" });
            return;
        }
        if (passwordForm.newPassword.length < 8) {
            setMessage({ type: "error", text: "Password must be at least 8 characters long" });
            return;
        }
        setIsLoading(true);
        try {
            await changePassword(
                { current_password: passwordForm.currentPassword, new_password: passwordForm.newPassword },
                authToken
            );
            setMessage({ type: "success", text: "Password updated successfully" });
            setPasswordForm({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
        } catch (error) {
            const errorMsg = error?.response?.data?.detail || error?.message;
            if (errorMsg?.toLowerCase().includes("current password") || errorMsg?.toLowerCase().includes("incorrect password")) {
                setMessage({ type: "error", text: "Current password is incorrect" });
            } else {
                setMessage({ type: "error", text: "Failed to update password" });
            }
        }
    };

    // Address form handlers
    const handleAddressChange = (id, field, value) => {
        setAddresses((prev) =>
            prev.map((addr) => (addr.id === id ? { ...addr, [field]: value } : addr))
        );
        // Clear error when user starts typing
        if (addressErrors[id]?.[field]) {
            setAddressErrors(prev => ({
                ...prev,
                [id]: {
                    ...prev[id],
                    [field]: ""
                }
            }));
        }
    };

    // Validate address fields
    const validateAddress = (address) => {
        const errors = {};

        if (!address.fullName?.trim()) {
            errors.fullName = "Full name is required";
        }

        if (!address.label?.trim()) {
            errors.label = "Label is required";
        }

        if (!address.addressLine?.trim()) {
            errors.addressLine = "Address line 1 is required";
        }

        if (!address.city?.trim()) {
            errors.city = "City is required";
        }

        if (!address.state?.trim()) {
            errors.state = "State is required";
        }

        if (!address.postalCode?.trim()) {
            errors.postalCode = "Postal code is required";
        } else if (!/^[a-zA-Z0-9\s-]{3,10}$/.test(address.postalCode.trim())) {
            errors.postalCode = "Please enter a valid postal code";
        }

        if (!address.country?.trim()) {
            errors.country = "Country is required";
        }

        const phonePattern = /^[0-9]{10}$/;
        if (!address.phone?.trim()) {
            errors.phone = "Phone number is required";
        } else if (!phonePattern.test(address.phone.replace(/\D/g, ''))) {
            errors.phone = "Please enter a valid 10-digit phone number";
        }

        return errors;
    };

    // Add new blank address locally
    const addAddress = () => {
        setAddresses((prev) => [
            ...prev,
            {
                id: `new-${Date.now()}`,
                label: "",
                addressLine: "",
                addressLine2: "",
                city: "",
                state: "",
                postalCode: "",
                country: "",
                phone: userInfo.contactNumber || "",
                fullName: userInfo.fullName || "",
                isDefault: false
            },
        ]);
    };

    // Remove address locally and from server if persisted
    const removeAddress = async (id) => {
        if (addresses.length <= 1) {
            setMessage({ type: "error", text: "At least one address is required" });
            return;
        }
        const addrToRemove = addresses.find((a) => a.id === id);
        if (typeof addrToRemove.id === "number") {
            // Persisted address - delete via API
            setIsLoading(true);
            try {
                await deleteUserAddress(id);
                setAddresses((prev) => prev.filter((addr) => addr.id !== id));
                setMessage({ type: "success", text: "Address deleted successfully" });
            } catch {
                setMessage({ type: "error", text: "Failed to delete address" });
            } finally {
                setIsLoading(false);
            }
        } else {
            // New address not saved yet - just remove locally
            setAddresses((prev) => prev.filter((addr) => addr.id !== id));
        }
    };

    // Save addresses (create new or update existing)
    const saveAddress = async (address) => {
        // Validate address before saving
        const errors = validateAddress(address);
        if (Object.keys(errors).length > 0) {
            setAddressErrors(prev => ({
                ...prev,
                [address.id]: errors
            }));
            setMessage({ type: "error", text: "Please fix the errors in the address form" });
            return;
        }

        setIsLoading(true);
        try {
            if (typeof address.id === "number") {
                // Update existing
                const updateData = {
                    label: address.label,
                    address_line1: address.addressLine,
                    address_line2: address.addressLine2,
                    city: address.city,
                    state: address.state,
                    postal_code: address.postalCode,
                    country: address.country,
                    phone: address.phone,
                    full_name: address.fullName || userInfo.fullName,
                    is_default: address.isDefault || false
                };
                await updateUserAddress(address.id, updateData);
                setMessage({ type: "success", text: "Address updated" });
                setEditingAddressId(null);
            } else {
                // Create new
                const createData = {
                    label: address.label,
                    address_line1: address.addressLine,
                    address_line2: address.addressLine2,
                    city: address.city,
                    state: address.state,
                    postal_code: address.postalCode,
                    country: address.country,
                    phone: address.phone,
                    full_name: address.fullName || userInfo.fullName,
                    is_default: address.isDefault || false
                };
                const resp = await createUserAddress(createData);
                // Replace temp id with real id from API
                setAddresses((prev) =>
                    prev.map((a) => (a.id === address.id ? { ...a, id: resp.data.id } : a))
                );
                setMessage({ type: "success", text: "Address created" });
                setEditingAddressId(null);
            }
            // Clear errors after successful save
            setAddressErrors(prev => ({
                ...prev,
                [address.id]: {}
            }));
        } catch {
            setMessage({ type: "error", text: "Failed to save address" });
        } finally {
            setIsLoading(false);
        }
    };

    // Clear messages after 5 seconds
    useEffect(() => {
        if (message.text) {
            const timer = setTimeout(() => setMessage({ type: "", text: "" }), 5000);
            return () => clearTimeout(timer);
        }
    }, [message.text]);

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-lg">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">User Profile</h1>
                <p className="text-gray-600">Manage your personal information, security, and addresses</p>
            </div>

            <div className="mb-6 flex space-x-4 border-b border-gray-200">
                {["profile", "password", "addresses"].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`pb-2 font-medium ${activeTab === tab ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-600 hover:text-gray-900"
                            }`}
                    >
                        {tab === "profile" ? "Edit Profile" : tab === "password" ? "Change Password" : "Your Addresses"}
                    </button>
                ))}
            </div>

            {message.text && (
                <div className={`mb-6 p-4 rounded-lg ${message.type === "error" ? "bg-red-50 border border-red-200 text-red-700" : "bg-green-50 border border-green-200 text-green-700"}`}>
                    {message.text}
                </div>
            )}

            {activeTab === "profile" && (
                <section className="bg-gray-50 rounded-2xl p-6 max-w-3xl">
                    <form onSubmit={submitUserInfo} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                                <input
                                    type="text"
                                    name="fullName"
                                    value={userInfo.fullName || ""}
                                    onChange={handleUserInfoChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                    placeholder="Your full name"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Contact Number</label>
                                <input
                                    type="tel"
                                    name="contactNumber"
                                    value={userInfo.contactNumber || ""}
                                    onChange={handleUserInfoChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                    placeholder="+1234567890"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                            <input
                                type="email"
                                name="email"
                                value={userInfo.email || ""}
                                onChange={handleUserInfoChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                placeholder="you@example.com"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Upload Profile Picture</label>
                            <input
                                type="file"
                                accept="image/*"
                                name="profilePictureFile"
                                onChange={(e) => handleUserInfoChange(e)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            />

                        </div>


                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
                            <input
                                type="date"
                                name="dateOfBirth"
                                value={userInfo.dateOfBirth || ""}
                                onChange={handleUserInfoChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                            <textarea
                                name="bio"
                                value={userInfo.bio || ""}
                                onChange={handleUserInfoChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                placeholder="Tell us a little about yourself"
                                rows={4}
                            />
                        </div>

                        <div className="flex justify-end pt-4">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                            >
                                {isLoading ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    </form>
                </section>
            )}


            {activeTab === "password" && (
                <section className="bg-gray-50 rounded-2xl p-6 max-w-2xl">
                    <form onSubmit={submitPasswordChange} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                            <input
                                type="password"
                                name="currentPassword"
                                value={passwordForm.currentPassword}
                                onChange={handlePasswordChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                                <input
                                    type="password"
                                    name="newPassword"
                                    value={passwordForm.newPassword}
                                    onChange={handlePasswordChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                                <input
                                    type="password"
                                    name="confirmNewPassword"
                                    value={passwordForm.confirmNewPassword}
                                    onChange={handlePasswordChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                            >
                                {isLoading ? "Updating..." : "Update Password"}
                            </button>
                        </div>
                    </form>
                </section>
            )}

            {activeTab === "addresses" && (
                <section className="bg-gray-50 rounded-2xl p-6 space-y-6">
                    {addresses.map((address) => (
                        <div key={address.id} className="bg-white p-6 rounded-xl border border-gray-200">
                            {editingAddressId === address.id ? (
                                // Edit Mode
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="font-medium text-gray-900">Edit Address</h3>
                                        <button
                                            onClick={() => {
                                                setEditingAddressId(null);
                                                // Clear errors when canceling
                                                setAddressErrors(prev => ({
                                                    ...prev,
                                                    [address.id]: {}
                                                }));
                                            }}
                                            className="text-gray-600 hover:text-gray-700 text-sm font-medium"
                                        >
                                            Cancel
                                        </button>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                                        <input
                                            type="text"
                                            value={address.fullName || userInfo.fullName || ""}
                                            onChange={(e) => handleAddressChange(address.id, "fullName", e.target.value)}
                                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${addressErrors[address.id]?.fullName ? "border-red-500" : "border-gray-300"
                                                }`}
                                            placeholder="Enter full name"
                                        />
                                        {addressErrors[address.id]?.fullName && (
                                            <p className="text-red-600 text-sm mt-1">{addressErrors[address.id].fullName}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Label *</label>
                                        <input
                                            type="text"
                                            value={address.label}
                                            onChange={(e) => handleAddressChange(address.id, "label", e.target.value)}
                                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${addressErrors[address.id]?.label ? "border-red-500" : "border-gray-300"
                                                }`}
                                            placeholder="Home, Office, etc."
                                        />
                                        {addressErrors[address.id]?.label && (
                                            <p className="text-red-600 text-sm mt-1">{addressErrors[address.id].label}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Address Line 1 *</label>
                                        <input
                                            type="text"
                                            value={address.addressLine}
                                            onChange={(e) => handleAddressChange(address.id, "addressLine", e.target.value)}
                                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${addressErrors[address.id]?.addressLine ? "border-red-500" : "border-gray-300"
                                                }`}
                                            placeholder="Street address"
                                        />
                                        {addressErrors[address.id]?.addressLine && (
                                            <p className="text-red-600 text-sm mt-1">{addressErrors[address.id].addressLine}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Address Line 2</label>
                                        <input
                                            type="text"
                                            value={address.addressLine2 || ""}
                                            onChange={(e) => handleAddressChange(address.id, "addressLine2", e.target.value)}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                            placeholder="Apartment, suite, unit, etc. (optional)"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                                        <input
                                            type="tel"
                                            value={address.phone}
                                            onChange={(e) => handleAddressChange(address.id, "phone", e.target.value.replace(/\D/g, '').slice(0, 10))}
                                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${addressErrors[address.id]?.phone ? "border-red-500" : "border-gray-300"
                                                }`}
                                            placeholder="1234567890"
                                            maxLength={10}
                                        />
                                        {addressErrors[address.id]?.phone && (
                                            <p className="text-red-600 text-sm mt-1">{addressErrors[address.id].phone}</p>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
                                            <input
                                                type="text"
                                                value={address.city}
                                                onChange={(e) => handleAddressChange(address.id, "city", e.target.value)}
                                                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${addressErrors[address.id]?.city ? "border-red-500" : "border-gray-300"
                                                    }`}
                                            />
                                            {addressErrors[address.id]?.city && (
                                                <p className="text-red-600 text-sm mt-1">{addressErrors[address.id].city}</p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">State/Province *</label>
                                            <input
                                                type="text"
                                                value={address.state}
                                                onChange={(e) => handleAddressChange(address.id, "state", e.target.value)}
                                                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${addressErrors[address.id]?.state ? "border-red-500" : "border-gray-300"
                                                    }`}
                                            />
                                            {addressErrors[address.id]?.state && (
                                                <p className="text-red-600 text-sm mt-1">{addressErrors[address.id].state}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Postal Code *</label>
                                            <input
                                                type="text"
                                                value={address.postalCode}
                                                onChange={(e) => handleAddressChange(address.id, "postalCode", e.target.value)}
                                                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${addressErrors[address.id]?.postalCode ? "border-red-500" : "border-gray-300"
                                                    }`}
                                            />
                                            {addressErrors[address.id]?.postalCode && (
                                                <p className="text-red-600 text-sm mt-1">{addressErrors[address.id].postalCode}</p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Country *</label>
                                            <input
                                                type="text"
                                                value={address.country}
                                                onChange={(e) => handleAddressChange(address.id, "country", e.target.value)}
                                                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${addressErrors[address.id]?.country ? "border-red-500" : "border-gray-300"
                                                    }`}
                                            />
                                            {addressErrors[address.id]?.country && (
                                                <p className="text-red-600 text-sm mt-1">{addressErrors[address.id].country}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 mt-4">
                                        <input
                                            type="checkbox"
                                            id={`setDefault-${address.id}`}
                                            checked={address.isDefault || false}
                                            onChange={(e) => handleAddressChange(address.id, "isDefault", e.target.checked)}
                                            className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                                        />
                                        <label htmlFor={`setDefault-${address.id}`} className="text-sm font-semibold text-gray-700">
                                            Set as default address
                                        </label>
                                    </div>

                                    <div className="flex justify-end pt-4 gap-2">
                                        <button
                                            type="button"
                                            disabled={isLoading}
                                            onClick={() => saveAddress(address)}
                                            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                                        >
                                            {isLoading ? "Saving..." : "Save Address"}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                // View Mode
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h3 className="font-medium text-gray-900">{address.label}</h3>
                                            {address.isDefault && (
                                                <span className="px-2.5 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-full">
                                                    DEFAULT
                                                </span>
                                            )}
                                            {addresses.length > 1 && (
                                                <button
                                                    onClick={() => removeAddress(address.id)}
                                                    className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center gap-1"
                                                >
                                                    <svg
                                                        className="w-4 h-4"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                    Remove
                                                </button>
                                            )}
                                        </div>
                                        <p className="font-semibold text-gray-900 mb-2">{address.fullName || userInfo.fullName}</p>
                                        <p className="text-gray-600">
                                            {address.addressLine}
                                            {address.addressLine2 && `, ${address.addressLine2}`}
                                        </p>
                                        <p className="text-gray-600">
                                            {address.city}, {address.state} {address.postalCode}
                                        </p>
                                        <p className="text-gray-600">{address.country}</p>
                                        <p className="text-blue-600 font-bold mt-2">📱 {address.phone}</p>
                                    </div>
                                    <button
                                        onClick={() => setEditingAddressId(address.id)}
                                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                                    >
                                        Edit
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}

                    <button
                        onClick={() => {
                            const newAddressId = `new-${Date.now()}`;
                            setAddresses(prev => [
                                ...prev,
                                {
                                    id: newAddressId,
                                    label: "",
                                    addressLine: "",
                                    addressLine2: "",
                                    city: "",
                                    state: "",
                                    postalCode: "",
                                    country: "",
                                    phone: userInfo.contactNumber || "",
                                    fullName: userInfo.fullName || "",
                                    isDefault: false
                                },
                            ]);
                            setEditingAddressId(newAddressId);
                        }}
                        className="w-full border-2 border-dashed border-gray-300 rounded-xl py-6 hover:border-gray-400 transition-colors group"
                    >
                        <div className="flex items-center justify-center gap-2 text-gray-600 group-hover:text-gray-700">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Add New Address
                        </div>
                    </button>
                </section>
            )}
        </div>
    );
}