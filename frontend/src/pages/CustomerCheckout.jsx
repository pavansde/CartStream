// import React, { useState, useContext, useMemo, useCallback, useEffect } from "react";
// import { useNavigate, useLocation } from "react-router-dom";
// import { CartContext } from "../context/CartContext";
// import { UpiQrPayment } from "./UpiQrPayment";
// import { createOrder } from "../api/orders";
// import { redeemCoupon } from "../api/coupons";
// import {
//   getUserAddresses,
//   createUserAddress,
// } from "../api/addresses";
// import { getActiveCoupons } from "../api/coupons";

// const InputField = React.memo(({
//   section, field, label, type = "text", required = false,
//   placeholder, value, onChange, error, disabled = false
// }) => (
//   <div className="mb-6">
//     <label className="block text-sm font-semibold text-gray-800 mb-3">
//       {label} {required && <span className="text-red-500 ml-1">*</span>}
//     </label>
//     <input
//       type={type}
//       name={field}
//       value={value}
//       onChange={onChange}
//       placeholder={placeholder}
//       required={required}
//       disabled={disabled}
//       className={`w-full px-4 py-3.5 border-2 rounded-xl focus:ring-3 transition-all duration-300 outline-none bg-white shadow-sm font-medium
//         ${error
//           ? "border-red-400 focus:ring-red-100 focus:border-red-500"
//           : "border-gray-300 focus:ring-blue-100 focus:border-blue-500 hover:border-gray-400"
//         }
//         ${disabled ? "bg-gray-100 cursor-not-allowed opacity-70" : ""}
//       `}
//       spellCheck={false}
//       autoComplete="off"
//       aria-invalid={!!error}
//       aria-describedby={error ? `${field}-error` : undefined}
//     />
//     {error && (
//       <p
//         id={`${field}-error`}
//         className="mt-2 text-sm text-red-600 font-semibold flex items-center gap-1"
//         role="alert"
//       >
//         <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
//           <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
//         </svg>
//         {error}
//       </p>
//     )}
//   </div>
// ));

// const ProgressSteps = React.memo(({ currentStep, completedSteps }) => (
//   <div className="flex items-center justify-center space-x-4 sm:space-x-8 max-w-2xl mx-auto mb-12 px-4">
//     {[1, 2, 3].map(step => (
//       <React.Fragment key={step}>
//         <div className="flex flex-col items-center select-none cursor-default">
//           <div
//             className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-base sm:text-lg font-bold transition-all duration-500 transform ${completedSteps.includes(step)
//               ? "bg-green-500 text-white shadow-lg scale-110"
//               : currentStep === step
//                 ? "bg-blue-600 text-white shadow-lg scale-110 ring-4 ring-blue-100"
//                 : "bg-gray-200 text-gray-500"
//               }`}
//           >
//             {completedSteps.includes(step) ? (
//               <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
//               </svg>
//             ) : (
//               step
//             )}
//           </div>
//           <span className={`mt-3 text-xs sm:text-sm font-semibold transition-colors ${completedSteps.includes(step) || currentStep === step
//             ? "text-gray-900"
//             : "text-gray-500"
//             }`}>
//             {step === 1 ? "Shipping" : step === 2 ? "Review" : "Payment"}
//           </span>
//         </div>
//         {step < 3 && (
//           <div
//             className={`w-8 sm:w-24 h-1.5 transition-all duration-500 rounded-full ${completedSteps.includes(step)
//               ? "bg-green-500"
//               : currentStep > step
//                 ? "bg-blue-400"
//                 : "bg-gray-200"
//               }`}
//           />
//         )}
//       </React.Fragment>
//     ))}
//   </div>
// ));

// const AddressCard = ({ address, isSelected, onSelect, onEdit }) => (
//   <div
//     className={`p-5 border-2 rounded-xl cursor-pointer transition-all duration-300 ${isSelected
//       ? "border-blue-500 bg-blue-50 shadow-lg transform scale-[1.02]"
//       : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-md"
//       }`}
//     onClick={onSelect}
//   >
//     <div className="flex items-start justify-between mb-3">
//       <div className="flex items-center gap-3">
//         <div className={`w-3 h-3 rounded-full border-2 ${isSelected ? "bg-blue-500 border-blue-500" : "bg-white border-gray-400"
//           }`} />
//         <h4 className="font-bold text-gray-900 text-lg">{address.full_name}</h4>
//       </div>
//       {address.is_default && (
//         <span className="px-2.5 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-full">
//           DEFAULT
//         </span>
//       )}
//     </div>

//     <div className="space-y-1.5 text-gray-700">
//       <p className="font-medium">{address.address_line1}</p>
//       {address.address_line2 && (
//         <p className="font-medium">{address.address_line2}</p>
//       )}
//       <p className="font-medium">
//         {address.city}, {address.state} {address.postal_code}
//       </p>
//       <p className="font-medium">{address.country}</p>
//       <p className="text-blue-600 font-bold mt-2">📱 {address.phone}</p>
//     </div>

//     <button
//       type="button"
//       onClick={(e) => {
//         e.stopPropagation();
//         onEdit(address);
//       }}
//       className="mt-4 text-blue-600 hover:text-blue-800 font-semibold text-sm transition-colors"
//     >
//       Edit Address
//     </button>
//   </div>
// );

// const CouponSection = ({
//   appliedCoupon,
//   onApplyCoupon,
//   onRemoveCoupon,
//   subtotal,
//   isApplyingCoupon,
// }) => {
//   const [couponCode, setCouponCode] = useState("");
//   const [couponError, setCouponError] = useState("");
//   const [showCouponModal, setShowCouponModal] = useState(false);
//   const [availableCoupons, setAvailableCoupons] = useState([]);
//   const [isLoadingCoupons, setIsLoadingCoupons] = useState(false);

//   useEffect(() => {
//     if (showCouponModal) fetchAvailableCoupons();
//   }, [showCouponModal]);

//   const fetchAvailableCoupons = async () => {
//     try {
//       setIsLoadingCoupons(true);
//       const response = await getActiveCoupons();
//       setAvailableCoupons(response.data || []);
//     } catch {
//       setAvailableCoupons([]);
//     } finally {
//       setIsLoadingCoupons(false);
//     }
//   };

//   const applyManualCoupon = async () => {
//     if (!couponCode.trim()) {
//       setCouponError("Please enter a coupon code");
//       return;
//     }
//     try {
//       setCouponError("");
//       await onApplyCoupon(couponCode.toUpperCase());
//       setCouponCode("");
//       setShowCouponModal(false);
//     } catch {
//       // parent handles errors
//     }
//   };

//   const applyFromList = (code) => {
//     onApplyCoupon(code);
//     setShowCouponModal(false);
//   };

//   return (
//     <>
//       <div className="bg-white rounded-xl shadow p-6 mb-6 space-y-6">
//         <div className="flex justify-between items-center">
//           <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-3">
//             <span className="text-blue-600 text-xl">🎫</span> Apply Coupon
//           </h3>
//           <button
//             type="button"
//             onClick={() => setShowCouponModal(true)}
//             className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition"
//           >
//             View All Coupons
//           </button>
//         </div>

//         {appliedCoupon ? (
//           <div className="flex items-center justify-between p-5 bg-green-50 border border-green-300 rounded-lg">
//             <div className="flex items-center gap-4">
//               <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center shadow">
//                 <span className="text-green-700 text-2xl">🎫</span>
//               </div>
//               <div>
//                 <p className="font-bold text-green-700 text-xl">{appliedCoupon.code}</p>
//                 <p className="text-green-600 font-semibold">
//                   {appliedCoupon.discount_type === "percentage"
//                     ? `${appliedCoupon.discount_value}% OFF`
//                     : `₹${appliedCoupon.discount_value} OFF`}
//                   {appliedCoupon.min_order_amount > 0 && (
//                     <span className="ml-2 text-green-700">• Min order: ₹{appliedCoupon.min_order_amount}</span>
//                   )}
//                 </p>
//               </div>
//             </div>
//             <button
//               type="button"
//               onClick={onRemoveCoupon}
//               className="text-red-600 font-semibold hover:text-red-800 transition rounded-lg px-4 py-2 hover:bg-red-50"
//             >
//               Remove
//             </button>
//           </div>
//         ) : null}
//       </div>

//       <CouponModal
//         show={showCouponModal}
//         onClose={() => setShowCouponModal(false)}
//         couponCode={couponCode}
//         onCouponCodeChange={(value) => {
//           setCouponCode(value);
//           setCouponError("");
//         }}
//         onApplyManualCoupon={applyManualCoupon}
//         onApplyFromList={applyFromList}
//         couponError={couponError}
//         isApplyingCoupon={isApplyingCoupon}
//         availableCoupons={availableCoupons}
//         isLoadingCoupons={isLoadingCoupons}
//         subtotal={subtotal}
//       />
//     </>
//   );
// };

// const CouponModal = React.memo(({
//   show,
//   onClose,
//   couponCode,
//   onCouponCodeChange,
//   onApplyManualCoupon,
//   onApplyFromList,
//   couponError,
//   isApplyingCoupon,
//   availableCoupons,
//   isLoadingCoupons,
//   subtotal
// }) => {
//   if (!show) return null;

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
//       <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[80vh] overflow-y-auto p-6 relative animate-fadeIn">
//         <header className="flex justify-between items-center mb-4">
//           <h3 className="text-xl font-semibold text-gray-900">Apply Coupon</h3>
//           <button
//             onClick={onClose}
//             className="p-2 rounded hover:bg-gray-100 transition"
//             type="button"
//           >
//             <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//             </svg>
//           </button>
//         </header>

//         <div className="mb-6 flex items-center gap-3">
//           <input
//             type="text"
//             value={couponCode}
//             onChange={(e) => onCouponCodeChange(e.target.value.toUpperCase())}
//             placeholder="Enter coupon code"
//             className="flex-grow border border-gray-300 rounded-lg px-4 py-2 font-semibold text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
//             disabled={isApplyingCoupon}
//             autoFocus
//           />
//           <button
//             onClick={onApplyManualCoupon}
//             disabled={isApplyingCoupon || !couponCode.trim()}
//             className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-2 rounded-lg font-bold hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg"
//             type="button"
//           >
//             {isApplyingCoupon ? (
//               <span className="flex items-center gap-2">
//                 <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
//                 Applying...
//               </span>
//             ) : (
//               "Apply"
//             )}
//           </button>
//         </div>
//         {couponError && <p className="mb-4 text-red-600 font-semibold">{couponError}</p>}

//         {isLoadingCoupons ? (
//           <div className="text-center py-10">
//             <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
//             <p className="text-gray-600">Loading coupons...</p>
//           </div>
//         ) : availableCoupons.length === 0 ? (
//           <div className="text-center py-10 text-gray-500 font-medium">No coupons available</div>
//         ) : (
//           <ul className="space-y-4">
//             {availableCoupons.map((coupon) => {
//               const isEligible = subtotal >= (coupon.min_order_amount || 0);
//               return (
//                 <li
//                   key={coupon.id}
//                   className={`p-4 border rounded-lg flex flex-col md:flex-row md:justify-between md:items-center transition-shadow ${isEligible
//                     ? "border-green-300 bg-green-50 shadow-sm hover:shadow-md"
//                     : "border-gray-200 bg-gray-50 opacity-70"
//                     }`}
//                 >
//                   <div className="flex items-center gap-4 mb-3 md:mb-0">
//                     <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isEligible ? "bg-green-100" : "bg-gray-200"}`}>
//                       <span className={`text-xl font-extrabold ${isEligible ? "text-green-600" : "text-gray-400"}`}>
//                         🎫
//                       </span>
//                     </div>
//                     <div>
//                       <h4 className="text-lg font-semibold text-gray-900">{coupon.code}</h4>
//                       <p className={`font-semibold ${isEligible ? "text-green-700" : "text-gray-500"}`}>
//                         {coupon.discount_type === "percentage"
//                           ? `${coupon.discount_value}% OFF`
//                           : `₹${coupon.discount_value} OFF`}
//                       </p>
//                       {coupon.min_order_amount > 0 && (
//                         <p className={`text-sm font-medium ${isEligible ? "text-green-600" : "text-gray-500"}`}>
//                           Min order: ₹{coupon.min_order_amount}
//                         </p>
//                       )}
//                       {coupon.description && <p className="text-gray-600 text-sm mt-1">{coupon.description}</p>}
//                     </div>
//                   </div>
//                   <button
//                     disabled={!isEligible || isApplyingCoupon}
//                     onClick={() => onApplyFromList(coupon.code)}
//                     className={`py-2 px-6 rounded-lg font-semibold transition ${isEligible
//                       ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-lg"
//                       : "bg-gray-300 text-gray-500 cursor-not-allowed"
//                       }`}
//                     type="button"
//                   >
//                     {isEligible ? "Apply Coupon" : "Not Eligible"}
//                   </button>
//                 </li>
//               );
//             })}
//           </ul>
//         )}

//         <div className="mt-6 text-center">
//           <button
//             className="inline-block text-blue-600 hover:text-blue-800 font-semibold transition"
//             onClick={onClose}
//             type="button"
//           >
//             Close
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// });

// export default function CustomerCheckout() {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const apiBaseUrl = process.env.REACT_APP_API_URL


//   const { cart, clearCart } = useContext(CartContext);

//   const cartItems = Object.values(cart);

//   const [shippingErrors, setShippingErrors] = useState({});
//   const [currentStep, setCurrentStep] = useState(1);
//   const [completedSteps, setCompletedSteps] = useState([]);

//   const [formData, setFormData] = useState({
//     shipping: {
//       full_name: "",
//       phone: "",
//       address_line1: "",
//       address_line2: "",
//       city: "",
//       state: "",
//       postal_code: "",
//       country: "India",
//       is_default: false
//     },
//     payment: {
//       method: ""
//     },
//   });

//   const [appliedCoupon, setAppliedCoupon] = useState(null);
//   const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
//   const [couponMessage, setCouponMessage] = useState("");
//   const [upiPaymentConfirmed, setUpiPaymentConfirmed] = useState(false);
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [error, setError] = useState("");
//   const [successMessage, setSuccessMessage] = useState("");
//   const [showSuccessScreen, setShowSuccessScreen] = useState(false);

//   // Saved addresses related states
//   const [savedAddresses, setSavedAddresses] = useState([]);
//   const [selectedAddressId, setSelectedAddressId] = useState(null);
//   const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);
//   const [editingAddress, setEditingAddress] = useState(null);

//   // Fetch saved addresses on mount
//   useEffect(() => {
//     async function fetchSavedAddresses() {
//       try {
//         const userSavedAddresses = await getUserAddresses().then(res => res.data);
//         setSavedAddresses(userSavedAddresses);
//         if (userSavedAddresses.length > 0) {
//           const defaultAddress = userSavedAddresses.find(addr => addr.is_default) || userSavedAddresses[0];
//           setSelectedAddressId(defaultAddress.id);
//           setFormData(prev => ({
//             ...prev,
//             shipping: { ...defaultAddress }
//           }));
//           setIsAddingNewAddress(false);
//         }
//       } catch {
//       }
//     }
//     fetchSavedAddresses();
//   }, []);

//   const { subtotal, shippingCost, discount, total } = useMemo(() => {
//     const calcSubtotal = cartItems.reduce((sum, cartItem) => {
//       const price = cartItem.variant?.price || cartItem.item?.price || 0;
//       return sum + (price * (cartItem.quantity || 0));
//     }, 0);

//     const ship = 9.99;
//     let discountAmount = 0;

//     if (appliedCoupon && calcSubtotal >= (appliedCoupon.min_order_amount || 0)) {
//       if (appliedCoupon.discount_type === 'percentage') {
//         discountAmount = (calcSubtotal * appliedCoupon.discount_value) / 100;
//       } else {
//         discountAmount = appliedCoupon.discount_value;
//       }
//       discountAmount = Math.min(discountAmount, calcSubtotal);
//     }

//     const totalAmt = Math.max(0, calcSubtotal + ship - discountAmount);

//     return {
//       subtotal: Math.max(0, calcSubtotal),
//       shippingCost: ship,
//       discount: discountAmount,
//       total: totalAmt,
//     };
//   }, [cartItems, appliedCoupon]);

//   const handleInputChange = useCallback((section, field, value) => {
//     setFormData((prev) => ({
//       ...prev,
//       [section]: {
//         ...prev[section],
//         [field]: value,
//       },
//     }));
//   }, []);

//   const handleApplyCoupon = async (couponCode, orderTotal) => {
//     setIsApplyingCoupon(true);
//     setCouponMessage("");
//     setError("");

//     try {
//       const response = await redeemCoupon(couponCode, orderTotal);
//       setAppliedCoupon(response.data);
//       setCouponMessage("🎉 Coupon applied successfully!");

//       setTimeout(() => {
//         setCouponMessage("");
//       }, 3000);

//     } catch (err) {
//       const errorMessage =
//         Array.isArray(err.response?.data?.detail)
//           ? err.response.data.detail.map(e => e.msg).join(", ")
//           : err.response?.data?.detail || err.message || "Failed to apply coupon";
//       setError(errorMessage);
//       setCouponMessage("");
//     } finally {
//       setIsApplyingCoupon(false);
//     }
//   };

//   const handleRemoveCoupon = () => {
//     setAppliedCoupon(null);
//     setCouponMessage("");
//     setError("");
//   };

//   const validateCurrentStep = useCallback(() => {
//     if (currentStep === 1) {
//       const errors = {};
//       let isValid = true;

//       if (!formData.shipping.full_name?.trim()) {
//         errors.full_name = "Please enter your full name";
//         isValid = false;
//       }
//       if (!formData.shipping.address_line1?.trim()) {
//         errors.address_line1 = "Please enter your street address";
//         isValid = false;
//       }
//       if (!formData.shipping.city?.trim()) {
//         errors.city = "Please enter your city";
//         isValid = false;
//       }
//       if (!formData.shipping.state?.trim()) {
//         errors.state = "Please enter your state";
//         isValid = false;
//       }
//       if (!formData.shipping.country?.trim()) {
//         errors.country = "Please enter your country";
//         isValid = false;
//       }

//       const postalCodePattern = /^[a-zA-Z0-9\s-]{3,10}$/;
//       if (!postalCodePattern.test(formData.shipping.postal_code?.trim())) {
//         errors.postal_code = "Please enter a valid postal code";
//         isValid = false;
//       }

//       const phonePattern = /^[0-9]{10}$/;
//       if (!phonePattern.test(formData.shipping.phone?.replace(/\D/g, ''))) {
//         errors.phone = "Please enter a valid 10-digit phone number";
//         isValid = false;
//       }

//       setShippingErrors(errors);
//       return isValid;
//     }

//     if (currentStep === 2) {
//       return true;
//     }
//     if (currentStep === 3) {
//       if (!formData.payment.method) {
//         return false;
//       }
//       if (formData.payment.method === "upi" && !upiPaymentConfirmed) {
//         return false;
//       }
//       return true;
//     }
//     return true;
//   }, [currentStep, formData, upiPaymentConfirmed]);

//   const handleNext = useCallback(() => {
//     if (!validateCurrentStep()) {
//       setError(
//         `Please fill in all required ${currentStep === 1 ? "shipping" : "payment"
//         } details correctly`
//       );
//       return;
//     }
//     setError("");
//     setCompletedSteps((prev) => [...new Set([...prev, currentStep])]);
//     setCurrentStep((prev) => prev + 1);
//   }, [currentStep, validateCurrentStep]);

//   const handleBack = useCallback(() => {
//     setError("");
//     setCurrentStep((prev) => Math.max(1, prev - 1));
//   }, []);

//   // Save new address API call
//   const saveNewAddress = useCallback(async (address) => {
//     const savedAddress = await createUserAddress(address).then(res => res.data);
//     return savedAddress;
//   }, []);

//   // SIMPLIFIED Helper functions for new CartContext structure
//   const getDisplayPrice = (cartItem) => {
//     return cartItem.variant?.price || cartItem.item?.price || 0;
//   };

//   const getDisplayTitle = (cartItem) => {
//     let title = cartItem.item?.title || 'Unknown Item';

//     // Add variant info to title if available
//     if (cartItem.variant) {
//       const variantSpecs = [];
//       if (cartItem.variant.color) variantSpecs.push(cartItem.variant.color);
//       if (cartItem.variant.size) variantSpecs.push(cartItem.variant.size);

//       if (variantSpecs.length > 0) {
//         title += ` (${variantSpecs.join(' - ')})`;
//       }
//     }

//     return title;
//   };

//   const getDisplayImage = (cartItem) => {
//     // Priority 1: Variant image
//     if (cartItem.variant?.image_url) {
//       return `${apiBaseUrl}${cartItem.variant.image_url}`;
//     }

//     // Priority 2: First image from variant images array
//     if (cartItem.variant?.images && cartItem.variant.images.length > 0) {
//       return `${apiBaseUrl}${cartItem.variant.images[0]}`;
//     }

//     // Priority 3: Main item image
//     if (cartItem.item?.image_url) {
//       return `${apiBaseUrl}${cartItem.item.image_url}`;
//     }

//     // Fallback
//     return '/api/placeholder/60/60';
//   };

//   const handleSubmit = useCallback(
//     async (e) => {
//       e.preventDefault();
//       if (!validateCurrentStep()) {
//         setError("Please select a valid payment option and complete payment.");
//         return;
//       }
//       setIsSubmitting(true);
//       setError("");
//       try {
//         // UPDATED: Use new CartContext structure for order data
//         const orderData = {
//           items: cartItems.map(cartItem => ({
//             item_id: cartItem.item_id,
//             quantity: cartItem.quantity,
//             variant_id: cartItem.variant_id // Use direct variant_id from cart item
//           })),
//           shipping_address: formData.shipping,
//           coupon_code: appliedCoupon?.code || null,
//           shipping_charge: shippingCost,
//         };

//         console.log("Sending order data:", orderData);

//         await createOrder(orderData);

//         // Save new address if user is adding a new one
//         if (isAddingNewAddress) {
//           const savedAddress = await saveNewAddress(formData.shipping);
//           const updatedAddresses = await getUserAddresses().then(res => res.data);
//           setSavedAddresses(updatedAddresses);
//           setSelectedAddressId(savedAddress.id);
//           setIsAddingNewAddress(false);
//         }

//         await clearCart();
//         setSuccessMessage("🎉 Order placed successfully! Confirmation email will be sent.");
//         setCompletedSteps((prev) => [...new Set([...prev, 3])]);
//         setShowSuccessScreen(true);
//       } catch (err) {
//         setError("Failed to place order. Please try again.");
//         console.error("Order creation error:", err);
//       } finally {
//         setIsSubmitting(false);
//       }
//     },
//     [validateCurrentStep, clearCart, cartItems, formData.shipping, appliedCoupon, shippingCost, isAddingNewAddress, saveNewAddress]
//   );

//   // Enhanced Success Screen
//   const SuccessScreen = () => {
//     const navigate = useNavigate();

//     useEffect(() => {
//       const timer = setTimeout(() => {
//         navigate("/", { replace: true });
//       }, 5000); // 5000 ms = 5 seconds

//       return () => clearTimeout(timer); // cleanup if component unmounts early
//     }, [navigate]);

//     return (
//       <div className="fixed inset-0 bg-gradient-to-br from-green-50 to-emerald-100 flex flex-col items-center justify-center text-center z-50 p-8 animate-fadeIn">
//         <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-md w-full mx-auto transform animate-scaleIn">
//           <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg">
//             <svg
//               className="w-12 h-12 text-green-500"
//               fill="none"
//               stroke="currentColor"
//               viewBox="0 0 24 24"
//             >
//               <path
//                 strokeLinecap="round"
//                 strokeLinejoin="round"
//                 strokeWidth={2}
//                 d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
//               />
//             </svg>
//           </div>

//           <h2 className="text-3xl font-bold text-gray-900 mb-4">Order Confirmed!</h2>
//           <p className="text-gray-600 text-lg mb-2">
//             {successMessage || "Your order has been placed successfully."}
//           </p>
//           <p className="text-gray-500 mb-8">You will receive a confirmation email shortly.</p>

//           <button
//             onClick={() => navigate("/", { replace: true })}
//             className="w-full px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-bold hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
//           >
//             Continue Shopping
//           </button>
//         </div>
//       </div>
//     );
//   };

//   // Enhanced Saved Address Selection
//   const renderSavedAddressSelection = () => {
//     if (savedAddresses.length === 0) return null;

//     return (
//       <div className="mb-8">
//         <div className="flex items-center justify-between mb-6">
//           <h3 className="text-2xl font-bold text-gray-900">Select Delivery Address</h3>
//           <button
//             type="button"
//             onClick={() => {
//               setIsAddingNewAddress(true);
//               setSelectedAddressId(null);
//               setEditingAddress(null);
//               setFormData(prev => ({
//                 ...prev,
//                 shipping: {
//                   full_name: "",
//                   phone: "",
//                   address_line1: "",
//                   address_line2: "",
//                   city: "",
//                   state: "",
//                   postal_code: "",
//                   country: "India",
//                   is_default: false
//                 }
//               }));
//             }}
//             className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-bold hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl"
//           >
//             + Add New Address
//           </button>
//         </div>

//         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
//           {savedAddresses.map(addr => (
//             <AddressCard
//               key={addr.id}
//               address={addr}
//               isSelected={selectedAddressId === addr.id && !isAddingNewAddress}
//               onSelect={() => {
//                 setSelectedAddressId(addr.id);
//                 setFormData(prev => ({
//                   ...prev,
//                   shipping: { ...addr }
//                 }));
//                 setIsAddingNewAddress(false);
//                 setEditingAddress(null);
//               }}
//               onEdit={(address) => {
//                 setEditingAddress(address);
//                 setFormData(prev => ({
//                   ...prev,
//                   shipping: { ...address }
//                 }));
//                 setIsAddingNewAddress(true);
//               }}
//             />
//           ))}
//         </div>

//         {!isAddingNewAddress && (
//           <div className="text-center">
//             <button
//               type="button"
//               onClick={() => {
//                 setIsAddingNewAddress(true);
//                 setSelectedAddressId(null);
//                 setEditingAddress(null);
//                 setFormData(prev => ({
//                   ...prev,
//                   shipping: {
//                     full_name: "",
//                     phone: "",
//                     address_line1: "",
//                     address_line2: "",
//                     city: "",
//                     state: "",
//                     postal_code: "",
//                     country: "India",
//                     is_default: false
//                   }
//                 }));
//               }}
//               className="text-blue-600 hover:text-blue-800 font-bold text-lg transition-colors"
//             >
//               + Add New Address
//             </button>
//           </div>
//         )}
//       </div>
//     );
//   };

//   // Enhanced Shipping Form
//   const renderShippingStep = () => (
//     <>
//       {renderSavedAddressSelection()}

//       {(isAddingNewAddress || savedAddresses.length === 0) && (
//         <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 border-2 border-blue-200">
//           <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
//             {editingAddress ? "✏️ Edit Address" : "📍 Add New Address"}
//           </h3>

//           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//             <InputField
//               section="shipping"
//               field="full_name"
//               label="Full Name"
//               required
//               placeholder="Enter your full name"
//               value={formData.shipping.full_name}
//               onChange={(e) => handleInputChange("shipping", "full_name", e.target.value)}
//               error={shippingErrors.full_name}
//             />

//             <div className="mb-6">
//               <label className="block text-sm font-semibold text-gray-800 mb-3">
//                 Phone Number <span className="text-red-500 ml-1">*</span>
//               </label>
//               <div className="flex">
//                 <span className="inline-flex items-center px-4 rounded-l-xl border-2 border-r-0 border-gray-300 bg-gray-100 text-gray-700 font-bold select-none">
//                   +91
//                 </span>
//                 <input
//                   type="tel"
//                   name="phone"
//                   value={formData.shipping.phone}
//                   onChange={(e) => handleInputChange("shipping", "phone", e.target.value.replace(/\D/g, '').slice(0, 10))}
//                   placeholder="1234567890"
//                   maxLength={10}
//                   required
//                   className={`flex-grow px-4 py-3.5 border-2 border-gray-300 rounded-r-xl focus:ring-3 transition-all duration-300 outline-none font-medium
//                     ${shippingErrors.phone ? "border-red-400 focus:ring-red-100 focus:border-red-500" : "focus:ring-blue-100 focus:border-blue-500"}
//                   `}
//                   spellCheck={false}
//                   autoComplete="off"
//                   aria-invalid={!!shippingErrors.phone}
//                   aria-describedby={shippingErrors.phone ? "phone-error" : undefined}
//                 />
//               </div>
//               {shippingErrors.phone && (
//                 <p id="phone-error" className="text-red-600 text-sm mt-2 font-semibold flex items-center gap-1">
//                   <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
//                     <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
//                   </svg>
//                   {shippingErrors.phone}
//                 </p>
//               )}
//             </div>

//             <div className="md:col-span-2">
//               <InputField
//                 section="shipping"
//                 field="address_line1"
//                 label="Street Address"
//                 required
//                 placeholder="House No., Building, Street, Area"
//                 value={formData.shipping.address_line1}
//                 onChange={(e) => handleInputChange("shipping", "address_line1", e.target.value)}
//                 error={shippingErrors.address_line1}
//               />
//             </div>

//             <div className="md:col-span-2">
//               <InputField
//                 section="shipping"
//                 field="address_line2"
//                 label="Landmark (Optional)"
//                 placeholder="Near landmark, opposite to..."
//                 value={formData.shipping.address_line2}
//                 onChange={(e) => handleInputChange("shipping", "address_line2", e.target.value)}
//               />
//             </div>

//             <InputField
//               section="shipping"
//               field="city"
//               label="City"
//               required
//               placeholder="Enter your city"
//               value={formData.shipping.city}
//               onChange={(e) => handleInputChange("shipping", "city", e.target.value)}
//               error={shippingErrors.city}
//             />

//             <InputField
//               section="shipping"
//               field="state"
//               label="State"
//               required
//               placeholder="Enter your state"
//               value={formData.shipping.state}
//               onChange={(e) => handleInputChange("shipping", "state", e.target.value)}
//               error={shippingErrors.state}
//             />

//             <InputField
//               section="shipping"
//               field="postal_code"
//               label="PIN Code"
//               required
//               placeholder="Enter PIN code"
//               value={formData.shipping.postal_code}
//               onChange={(e) => handleInputChange("shipping", "postal_code", e.target.value.toUpperCase())}
//               error={shippingErrors.postal_code}
//             />

//             <InputField
//               section="shipping"
//               field="country"
//               label="Country"
//               required
//               value={formData.shipping.country}
//               onChange={(e) => handleInputChange("shipping", "country", e.target.value)}
//               error={shippingErrors.country}
//               disabled
//             />
//           </div>

//           <div className="flex items-center gap-3 mt-4">
//             <input
//               type="checkbox"
//               id="setDefault"
//               checked={formData.shipping.is_default}
//               onChange={(e) => handleInputChange("shipping", "is_default", e.target.checked)}
//               className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
//             />
//             <label htmlFor="setDefault" className="text-sm font-semibold text-gray-700">
//               Set as default address
//             </label>
//           </div>
//         </div>
//       )}
//     </>
//   );

//   // Enhanced Payment Step
//   const renderPaymentStep = () => (
//     <div className="space-y-6">
//       <h3 className="text-2xl font-bold text-gray-900 mb-6">Select Payment Method</h3>

//       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
//         {[
//           { value: "cod", label: "Cash on Delivery", icon: "💰", description: "Pay when you receive your order" },
//           { value: "upi", label: "UPI Payment", icon: "🧾", description: "Instant & secure UPI payment" },
//         ].map((method) => (
//           <label
//             key={method.value}
//             className={`cursor-pointer p-6 border-2 rounded-xl flex flex-col transition-all duration-300 ${formData.payment.method === method.value
//               ? "border-blue-500 bg-blue-50 shadow-lg transform scale-[1.02]"
//               : "border-gray-300 bg-white hover:border-gray-400 hover:shadow-md"
//               }`}
//           >
//             <input
//               type="radio"
//               name="paymentMethod"
//               value={method.value}
//               checked={formData.payment.method === method.value}
//               onChange={() => handleInputChange("payment", "method", method.value)}
//               className="hidden"
//             />
//             <div className="flex items-center gap-4 mb-3">
//               <span className="text-3xl">{method.icon}</span>
//               <div>
//                 <span className="font-bold text-gray-900 text-lg">{method.label}</span>
//                 <p className="text-sm text-gray-600 mt-1">{method.description}</p>
//               </div>
//             </div>
//           </label>
//         ))}
//       </div>

//       {formData.payment.method === "cod" && (
//         <div className="text-center py-8 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border-2 border-green-200">
//           <div className="text-4xl mb-4">💰</div>
//           <p className="text-gray-700 text-lg font-semibold">You will pay with cash when your order is delivered.</p>
//         </div>
//       )}

//       {formData.payment.method === "upi" && (
//         <UpiQrPayment
//           merchantUpiId="merchant@upi"
//           merchantName="Your Shop Name"
//           amount={total.toFixed(2)}
//           txnNote="Order Payment"
//           onPaymentConfirmed={() => setUpiPaymentConfirmed(true)}
//         />
//       )}

//       {formData.payment.method === "upi" && upiPaymentConfirmed && (
//         <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6 text-center">
//           <div className="flex items-center justify-center gap-3 text-green-700 font-bold text-lg">
//             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
//             </svg>
//             UPI Payment confirmed! You can now place your order.
//           </div>
//         </div>
//       )}
//     </div>
//   );

//   // Enhanced Review Step
//   const renderReviewStep = () => (
//     <div className="space-y-8">
//       {/* Shipping Address Review */}
//       <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-blue-200">
//         <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
//           📍 Shipping Address
//         </h3>
//         <div className="bg-white rounded-xl p-5 shadow-sm space-y-3">
//           <div className="flex justify-between items-start">
//             <div className="space-y-2">
//               <p className="font-bold text-gray-900 text-lg">{formData.shipping.full_name}</p>
//               <p className="font-medium text-gray-700">{formData.shipping.address_line1}</p>
//               {formData.shipping.address_line2 && (
//                 <p className="font-medium text-gray-700">{formData.shipping.address_line2}</p>
//               )}
//               <p className="font-medium text-gray-700">
//                 {formData.shipping.city}, {formData.shipping.state} {formData.shipping.postal_code}
//               </p>
//               <p className="font-medium text-gray-700">{formData.shipping.country}</p>
//               <p className="text-blue-600 font-bold">📱 {formData.shipping.phone}</p>
//             </div>
//             <button
//               type="button"
//               onClick={() => setCurrentStep(1)}
//               className="text-blue-600 hover:text-blue-800 font-semibold text-sm px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors"
//             >
//               Change
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* Order Items Review */}
//       <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-purple-200">
//         <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
//           🛒 Order Items
//         </h3>
//         <div className="space-y-4">
//           {cartItems.map((cartItem) => {
//             const displayPrice = getDisplayPrice(cartItem);
//             const displayTitle = getDisplayTitle(cartItem);
//             const displayImage = getDisplayImage(cartItem);

//             return (
//               <div key={cartItem.id} className="flex justify-between items-center bg-white rounded-xl p-4 shadow-sm">
//                 <div className="flex items-center gap-4">
//                   <img
//                     src={displayImage}
//                     alt={displayTitle}
//                     className="w-16 h-16 object-cover rounded-lg shadow-sm"
//                     onError={e => (e.target.src = "/api/placeholder/60/60")}
//                   />
//                   <div>
//                     <p className="font-bold text-gray-900">{displayTitle}</p>
//                     <p className="text-gray-600 text-sm">Qty: {cartItem.quantity}</p>
//                     {/* Show variant details if available */}
//                     {cartItem.variant && (
//                       <div className="flex flex-wrap gap-1 mt-1">
//                         {cartItem.variant.color && (
//                           <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
//                             Color: {cartItem.variant.color}
//                           </span>
//                         )}
//                         {cartItem.variant.size && (
//                           <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
//                             Size: {cartItem.variant.size}
//                           </span>
//                         )}
//                       </div>
//                     )}
//                   </div>
//                 </div>
//                 <div className="font-bold text-gray-900">₹{(displayPrice * cartItem.quantity).toFixed(2)}</div>
//               </div>
//             );
//           })}
//         </div>
//       </div>

//       {/* Coupon Section Only - No duplicate message */}
//       <CouponSection
//         appliedCoupon={appliedCoupon}
//         onApplyCoupon={(code) => handleApplyCoupon(code, subtotal)}
//         onRemoveCoupon={handleRemoveCoupon}
//         subtotal={subtotal}
//         isApplyingCoupon={isApplyingCoupon}
//       />
//     </div>
//   );

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8 px-4 sm:px-6 lg:px-8 relative">
//       <div className="max-w-7xl mx-auto">
//         <h1 className="text-center text-4xl sm:text-5xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-8">
//           Secure Checkout
//         </h1>

//         <ProgressSteps currentStep={currentStep} completedSteps={completedSteps} />

//         {/* Success & Error Messages at Top */}
//         {couponMessage && (
//           <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 text-green-800 px-6 py-4 rounded-xl mb-6 max-w-7xl mx-auto font-semibold flex items-center gap-3 animate-fadeInOut">
//             <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
//               <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
//             </svg>
//             {couponMessage}
//           </div>
//         )}

//         {error && (
//           <div className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 text-red-800 px-6 py-4 rounded-xl mb-6 max-w-7xl mx-auto font-semibold flex items-center gap-3">
//             <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
//               <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
//             </svg>
//             {error}
//           </div>
//         )}

//         <form onSubmit={handleSubmit}>
//           <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
//             {/* Main Content */}
//             <section className="xl:col-span-2 bg-white rounded-3xl shadow-2xl border border-gray-100 p-6 sm:p-8">
//               {currentStep === 1 && renderShippingStep()}
//               {currentStep === 2 && renderReviewStep()}
//               {currentStep === 3 && renderPaymentStep()}
//             </section>

//             {/* Order Summary Sidebar */}
//             <section className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-6 h-fit sticky top-8">
//               <h3 className="text-xl font-black text-gray-900 mb-6 pb-4 border-b-2 border-gray-100">Order Summary</h3>

//               <div className="space-y-4 mb-6 max-h-80 overflow-y-auto">
//                 {cartItems.map((cartItem) => {
//                   const displayPrice = getDisplayPrice(cartItem);
//                   const displayTitle = getDisplayTitle(cartItem);
//                   const displayImage = getDisplayImage(cartItem);

//                   return (
//                     <div key={cartItem.id} className="flex justify-between items-center bg-gray-50 rounded-xl p-4">
//                       <div className="flex items-center gap-3">
//                         <img
//                           src={displayImage}
//                           alt={displayTitle}
//                           className="w-12 h-12 object-cover rounded-lg shadow-sm"
//                           onError={e => (e.target.src = "/api/placeholder/50/50")}
//                         />
//                         <div className="min-w-0 flex-1">
//                           <p className="font-bold text-gray-900 text-sm leading-tight truncate">{displayTitle}</p>
//                           <p className="text-gray-600 text-xs">Qty: {cartItem.quantity}</p>
//                           {/* Show variant badges if available */}
//                           {cartItem.variant && (
//                             <div className="flex flex-wrap gap-1 mt-1">
//                               {cartItem.variant.color && (
//                                 <span className="inline-block px-1.5 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">
//                                   {cartItem.variant.color}
//                                 </span>
//                               )}
//                               {cartItem.variant.size && (
//                                 <span className="inline-block px-1.5 py-0.5 bg-green-100 text-green-800 text-xs rounded">
//                                   {cartItem.variant.size}
//                                 </span>
//                               )}
//                             </div>
//                           )}
//                         </div>
//                       </div>
//                       <span className="font-black text-gray-900 whitespace-nowrap">₹{(displayPrice * cartItem.quantity).toFixed(2)}</span>
//                     </div>
//                   );
//                 })}
//               </div>

//               <div className="border-t-2 border-gray-100 pt-6 space-y-3">
//                 <div className="flex justify-between text-gray-700">
//                   <span className="font-semibold">Subtotal</span>
//                   <span className="font-bold">₹{subtotal.toFixed(2)}</span>
//                 </div>

//                 {discount > 0 && (
//                   <div className="flex justify-between text-green-600">
//                     <span className="font-semibold">Discount</span>
//                     <span className="font-bold">-₹{discount.toFixed(2)}</span>
//                   </div>
//                 )}

//                 <div className="flex justify-between text-gray-700">
//                   <span className="font-semibold">Shipping</span>
//                   <span className="font-bold">₹{shippingCost.toFixed(2)}</span>
//                 </div>

//                 <div className="flex justify-between text-xl font-black border-t-2 border-gray-100 pt-4">
//                   <span>Total Amount</span>
//                   <span className="text-blue-600">₹{total.toFixed(2)}</span>
//                 </div>
//               </div>

//               {appliedCoupon && (
//                 <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl">
//                   <p className="text-green-800 font-bold text-sm">Coupon Applied: {appliedCoupon.code}</p>
//                   <p className="text-green-700 text-xs font-semibold mt-1">
//                     {appliedCoupon.discount_type === 'percentage'
//                       ? `${appliedCoupon.discount_value}% OFF`
//                       : `₹${appliedCoupon.discount_value} OFF`
//                     }
//                   </p>
//                 </div>
//               )}
//             </section>
//           </div>

//           {/* Navigation Buttons */}
//           <div className="mt-8 flex justify-between max-w-7xl mx-auto px-4">
//             <button
//               type="button"
//               onClick={handleBack}
//               disabled={currentStep === 1}
//               className="px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-2xl font-bold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl"
//             >
//               ← Back
//             </button>

//             {currentStep < 3 ? (
//               <button
//                 type="button"
//                 onClick={handleNext}
//                 className="px-12 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl font-bold hover:from-blue-700 hover:to-blue-800 shadow-2xl transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-2xl"
//               >
//                 Continue →
//               </button>
//             ) : (
//               <button
//                 type="submit"
//                 disabled={isSubmitting || cartItems.length === 0}
//                 className="px-12 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-2xl font-bold hover:from-green-700 hover:to-green-800 shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-2xl"
//               >
//                 {isSubmitting ? (
//                   <div className="flex items-center gap-2">
//                     <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
//                     Placing Order...
//                   </div>
//                 ) : (
//                   `Place Order • ₹${total.toFixed(2)}`
//                 )}
//               </button>
//             )}
//           </div>
//         </form>
//       </div>

//       {showSuccessScreen && <SuccessScreen />}
//     </div>
//   );
// }

import React, { useState, useContext, useMemo, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CartContext } from "../context/CartContext";
import { UpiQrPayment } from "./UpiQrPayment";
import { createOrder } from "../api/orders";
import { redeemCoupon, getActiveCoupons } from "../api/coupons";
import { getUserAddresses, createUserAddress } from "../api/addresses";
import { ui } from "../theme/ui";


/* ----------------------------- Reusable Inputs ----------------------------- */
const InputField = React.memo(
  ({ section, field, label, type = "text", required = false, placeholder, value, onChange, error, disabled = false }) => (
    <div className="mb-6">
      <label className="block text-sm font-semibold text-gray-800 mb-2">
        {label} {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type={type}
        name={field}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={`${ui.input} ${disabled ? "bg-gray-100 cursor-not-allowed opacity-70" : ""} ${error ? "border-red-400 focus:ring-red-100 focus:border-red-500" : ""}`}
        spellCheck={false}
        autoComplete="off"
        aria-invalid={!!error}
        aria-describedby={error ? `${field}-error` : undefined}
      />
      {error && (
        <p id={`${field}-error`} className="mt-2 text-sm text-red-600 font-semibold flex items-center gap-1" role="alert">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </p>
      )}
    </div>
  )
);

/* ------------------------------ Progress Steps ----------------------------- */
const ProgressSteps = React.memo(({ currentStep, completedSteps }) => (
  <div className="flex items-center justify-center gap-6 sm:gap-10 max-w-xl mx-auto mb-8">
    {[1, 2, 3].map((step, idx) => (
      <React.Fragment key={step}>
        <div className="flex flex-col items-center">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
              completedSteps.includes(step)
                ? "bg-emerald-600 text-white"
                : currentStep === step
                ? "bg-blue-600 text-white ring-4 ring-blue-100"
                : "bg-gray-200 text-gray-600"
            }`}
          >
            {completedSteps.includes(step) ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              step
            )}
          </div>
          <span className={`mt-2 text-xs font-semibold ${currentStep === step || completedSteps.includes(step) ? "text-gray-900" : "text-gray-500"}`}>
            {step === 1 ? "Shipping" : step === 2 ? "Review" : "Payment"}
          </span>
        </div>
        {idx < 2 && <div className={`h-1 w-16 rounded-full ${currentStep > step ? "bg-blue-400" : "bg-gray-200"}`} />}
      </React.Fragment>
    ))}
  </div>
));

/* ------------------------------ Address Card ------------------------------ */
const AddressCard = ({ address, isSelected, onSelect, onEdit }) => (
  <div
    className={`p-5 border rounded-2xl cursor-pointer transition-colors ${isSelected ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white hover:border-gray-300"} ${ui.card}`}
    onClick={onSelect}
  >
    <div className="flex items-start justify-between mb-3">
      <div className="flex items-center gap-3">
        <span className={`w-3 h-3 rounded-full border ${isSelected ? "bg-blue-600 border-blue-600" : "bg-white border-gray-400"}`} />
        <h4 className="font-semibold text-gray-900">{address.full_name}</h4>
      </div>
      {address.is_default && <span className={`${ui.badge} bg-emerald-100 text-emerald-700`}>Default</span>}
    </div>
    <div className="space-y-1 text-gray-700">
      <p>{address.address_line1}</p>
      {address.address_line2 && <p>{address.address_line2}</p>}
      <p>
        {address.city}, {address.state} {address.postal_code}
      </p>
      <p>{address.country}</p>
      <p className="text-blue-600 font-semibold mt-1">📱 {address.phone}</p>
    </div>
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onEdit(address);
      }}
      className="mt-4 text-blue-600 hover:text-blue-800 font-semibold text-sm"
    >
      Edit Address
    </button>
  </div>
);

/* ---------------------------- Shipping Mode Card --------------------------- */
const ShippingModeSelector = React.memo(({ shippingMode, setShippingMode }) => {
  const SHIPPING_PRICE = 9.99;
  return (
    <div className="mt-8">
      <h4 className="text-lg font-semibold text-gray-900 mb-3">Delivery Method</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className={`${ui.card} p-4 cursor-pointer ${shippingMode === "pickup" ? "border-blue-500 bg-blue-50" : ""}`}>
          <div className="flex items-start gap-3">
            <input
              type="radio"
              name="shippingMode"
              value="pickup"
              checked={shippingMode === "pickup"}
              onChange={() => setShippingMode("pickup")}
              className="mt-1 h-4 w-4 text-blue-600"
            />
            <div>
              <p className="font-semibold text-gray-900">Store pickup</p>
              <p className={ui.subTitle}>
                In 20 min • <span className="text-emerald-600 font-semibold">Free</span>
              </p>
            </div>
          </div>
        </label>

        <label className={`${ui.card} p-4 cursor-pointer ${shippingMode === "delivery" ? "border-blue-500 bg-blue-50" : ""}`}>
          <div className="flex items-start gap-3">
            <input
              type="radio"
              name="shippingMode"
              value="delivery"
              checked={shippingMode === "delivery"}
              onChange={() => setShippingMode("delivery")}
              className="mt-1 h-4 w-4 text-blue-600"
            />
            <div>
              <p className="font-semibold text-gray-900">Home delivery</p>
              <p className={ui.subTitle}>
                2–4 days • <span className="font-semibold">{`₹${SHIPPING_PRICE.toFixed(2)}`}</span>
              </p>
            </div>
          </div>
        </label>
      </div>
    </div>
  );
});

/* ------------------------------ Coupon Modal ------------------------------ */
const CouponModal = React.memo(function CouponModal({
  show,
  onClose,
  couponCode,
  onCouponCodeChange,
  onApplyManualCoupon,
  onApplyFromList,
  couponError,
  isApplyingCoupon,
  availableCoupons,
  isLoadingCoupons,
  subtotal,
}) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`${ui.card} max-w-lg w-full max-h-[80vh] overflow-y-auto p-6 relative`}>
        <header className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-900">Apply Coupon</h3>
          <button onClick={onClose} className="p-2 rounded hover:bg-gray-100" type="button" aria-label="Close">
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        <div className="mb-4 flex items-center gap-3">
          <input
            type="text"
            value={couponCode}
            onChange={(e) => onCouponCodeChange(e.target.value.toUpperCase())}
            placeholder="Enter coupon code"
            className={ui.input}
            disabled={isApplyingCoupon}
            autoFocus
          />
          <button
            onClick={onApplyManualCoupon}
            disabled={isApplyingCoupon || !couponCode.trim()}
            className={ui.btnPrimary + " disabled:opacity-50"}
            type="button"
          >
            {isApplyingCoupon ? "Applying..." : "Apply"}
          </button>
        </div>
        {couponError && <p className="mb-4 text-red-600 font-semibold">{couponError}</p>}

        {isLoadingCoupons ? (
          <div className="text-center py-10">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading coupons...</p>
          </div>
        ) : availableCoupons.length === 0 ? (
          <div className="text-center py-10 text-gray-500 font-medium">No coupons available</div>
        ) : (
          <ul className="space-y-3">
            {availableCoupons.map((coupon) => {
              const eligible = subtotal >= (coupon.min_order_amount || 0);
              return (
                <li key={coupon.id} className={`${ui.card} p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${eligible ? "bg-emerald-100" : "bg-gray-200"}`}>
                      <span className={`${eligible ? "text-emerald-700" : "text-gray-500"}`}>🎫</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{coupon.code}</h4>
                      <p className={`text-sm ${eligible ? "text-emerald-700" : "text-gray-500"}`}>
                        {coupon.discount_type === "percentage" ? `${coupon.discount_value}% OFF` : `₹${coupon.discount_value} OFF`}
                      </p>
                      {coupon.min_order_amount ? (
                        <p className={`text-xs ${eligible ? "text-emerald-600" : "text-gray-500"}`}>Min order: ₹{coupon.min_order_amount}</p>
                      ) : null}
                    </div>
                  </div>
                  <button
                    disabled={!eligible || isApplyingCoupon}
                    onClick={() => onApplyFromList(coupon.code)}
                    className={`${eligible ? ui.btnPrimary : "px-5 py-2.5 bg-gray-200 text-gray-500 rounded-lg"} mt-3 sm:mt-0`}
                    type="button"
                  >
                    {eligible ? "Apply" : "Not eligible"}
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <div className="mt-6 text-center">
          <button className="text-blue-600 hover:text-blue-800 font-semibold" onClick={onClose} type="button">
            Close
          </button>
        </div>
      </div>
    </div>
  );
});

/* ------------------------------ Coupon Section ----------------------------- */
const CouponSection = ({ appliedCoupon, onApplyCoupon, onRemoveCoupon, subtotal, isApplyingCoupon }) => {
  const [couponCode, setCouponCode] = useState("");
  const [couponError, setCouponError] = useState("");
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [isLoadingCoupons, setIsLoadingCoupons] = useState(false);

  useEffect(() => {
    if (!showCouponModal) return;
    (async () => {
      try {
        setIsLoadingCoupons(true);
        const res = await getActiveCoupons();
        setAvailableCoupons(res.data || []);
      } catch {
        setAvailableCoupons([]);
      } finally {
        setIsLoadingCoupons(false);
      }
    })();
  }, [showCouponModal]);

  const applyManualCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError("Please enter a coupon code");
      return;
    }
    try {
      setCouponError("");
      await onApplyCoupon(couponCode.toUpperCase());
      setCouponCode("");
      setShowCouponModal(false);
    } catch {
      // handled by parent
    }
  };

  return (
    <>
      <div className={`${ui.card} p-6 mb-6 space-y-4`}>
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <span className={`${ui.badge} bg-blue-50 text-blue-700`}>Coupon</span>
            Apply discount
          </h3>
          <button type="button" onClick={() => setShowCouponModal(true)} className={`${ui.btnOutline} border-blue-600 text-blue-600 hover:bg-blue-50`}>
            View Coupons
          </button>
        </div>

        {appliedCoupon ? (
          <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">🎫</div>
              <div>
                <p className="font-bold text-emerald-700">{appliedCoupon.code}</p>
                <p className="text-emerald-700 text-sm">
                  {appliedCoupon.discount_type === "percentage" ? `${appliedCoupon.discount_value}% OFF` : `₹${appliedCoupon.discount_value} OFF`}
                  {appliedCoupon.min_order_amount > 0 && <span className="ml-2">• Min: ₹{appliedCoupon.min_order_amount}</span>}
                </p>
              </div>
            </div>
            <button type="button" onClick={onRemoveCoupon} className="text-red-600 hover:text-red-700 font-semibold">
              Remove
            </button>
          </div>
        ) : null}
      </div>

      <CouponModal
        show={showCouponModal}
        onClose={() => setShowCouponModal(false)}
        couponCode={couponCode}
        onCouponCodeChange={(v) => {
          setCouponCode(v);
          setCouponError("");
        }}
        onApplyManualCoupon={applyManualCoupon}
        onApplyFromList={(code) => {
          onApplyCoupon(code);
          setShowCouponModal(false);
        }}
        couponError={couponError}
        isApplyingCoupon={isApplyingCoupon}
        availableCoupons={availableCoupons}
        isLoadingCoupons={isLoadingCoupons}
        subtotal={subtotal}
      />
    </>
  );
};

/* ----------------------------- Main Component ----------------------------- */
export default function CustomerCheckout() {
  const navigate = useNavigate();
  const apiBaseUrl = process.env.REACT_APP_API_URL;

  // Cart
  const { cart, clearCart } = useContext(CartContext);
  const cartItems = Object.values(cart);

  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [shippingErrors, setShippingErrors] = useState({});
  const [shippingMode, setShippingMode] = useState("delivery"); // 'pickup' | 'delivery'

  const [formData, setFormData] = useState({
    shipping: {
      full_name: "",
      phone: "",
      address_line1: "",
      address_line2: "",
      city: "",
      state: "",
      postal_code: "",
      country: "India",
      is_default: false,
    },
    payment: { method: "" },
  });

  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [couponMessage, setCouponMessage] = useState("");
  const [upiPaymentConfirmed, setUpiPaymentConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showSuccessScreen, setShowSuccessScreen] = useState(false);

  // Addresses
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);

  // Load saved addresses once
  useEffect(() => {
    (async () => {
      try {
        const data = await getUserAddresses().then((res) => res.data);
        setSavedAddresses(data);
        if (data.length > 0) {
          const def = data.find((a) => a.is_default) || data[0];
          setSelectedAddressId(def.id);
          setFormData((prev) => ({ ...prev, shipping: { ...def } }));
          setIsAddingNewAddress(false);
        }
      } catch {
        // silent
      }
    })();
  }, []);

  // Totals (theme-consistent)
  const { subtotal, shippingCost, discount, total } = useMemo(() => {
    const sub = cartItems.reduce((sum, ci) => sum + (ci.variant?.price || ci.item?.price || 0) * (ci.quantity || 0), 0);
    const ship = shippingMode === "pickup" ? 0 : 9.99;
    let disc = 0;
    if (appliedCoupon && sub >= (appliedCoupon.min_order_amount || 0)) {
      disc = appliedCoupon.discount_type === "percentage" ? (sub * appliedCoupon.discount_value) / 100 : appliedCoupon.discount_value;
      disc = Math.min(disc, sub);
    }
    return { subtotal: Math.max(0, sub), shippingCost: ship, discount: disc, total: Math.max(0, sub + ship - disc) };
  }, [cartItems, appliedCoupon, shippingMode]);

  const handleInputChange = useCallback((section, field, value) => {
    setFormData((prev) => ({ ...prev, [section]: { ...prev[section], [field]: value } }));
  }, []);

  const handleApplyCoupon = async (couponCode, orderTotal) => {
    setIsApplyingCoupon(true);
    setCouponMessage("");
    setError("");
    try {
      const res = await redeemCoupon(couponCode, orderTotal);
      setAppliedCoupon(res.data);
      setCouponMessage("Coupon applied!");
      setTimeout(() => setCouponMessage(""), 2500);
    } catch (err) {
      const msg =
        Array.isArray(err.response?.data?.detail)
          ? err.response.data.detail.map((e) => e.msg).join(", ")
          : err.response?.data?.detail || err.message || "Failed to apply coupon";
      setError(msg);
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponMessage("");
    setError("");
  };

  const validateCurrentStep = useCallback(() => {
  if (currentStep === 1) {
    const errors = {};
    let ok = true;
    const s = formData.shipping || {};

    if (!s.full_name?.trim()) {
      errors.full_name = "Please enter your full name";
      ok = false;
    }
    if (!s.address_line1?.trim()) {
      errors.address_line1 = "Please enter your street address";
      ok = false;
    }
    if (!s.city?.trim()) {
      errors.city = "Please enter your city";
      ok = false;
    }
    if (!s.state?.trim()) {
      errors.state = "Please enter your state";
      ok = false;
    }
    if (!s.country?.trim()) {
      errors.country = "Please enter your country";
      ok = false;
    }

    const postalCodePattern = /^[a-zA-Z0-9\s-]{3,10}$/;
    if (!postalCodePattern.test((s.postal_code || "").trim())) {
      errors.postal_code = "Please enter a valid postal code";
      ok = false;
    }

    const phonePattern = /^[0-9]{10}$/;
    if (!phonePattern.test((s.phone || "").replace(/\D/g, ""))) {
      errors.phone = "Please enter a valid 10-digit phone number";
      ok = false;
    }

    setShippingErrors(errors);
    return ok;
  }

  if (currentStep === 2) {
    return true;
  }

  if (currentStep === 3) {
    if (!formData.payment.method) return false;
    if (formData.payment.method === "upi" && !upiPaymentConfirmed) return false;
    return true;
  }

  return true;
}, [currentStep, formData, upiPaymentConfirmed]);

  const handleNext = useCallback(() => {
    if (!validateCurrentStep()) {
      setError(`Please fill in all required ${currentStep === 1 ? "shipping" : "payment"} details correctly`);
      return;
    }
    setError("");
    setCompletedSteps((prev) => [...new Set([...prev, currentStep])]);
    setCurrentStep((prev) => prev + 1);
  }, [currentStep, validateCurrentStep]);

  const handleBack = useCallback(() => {
    setError("");
    setCurrentStep((prev) => Math.max(1, prev - 1));
  }, []);

  const saveNewAddress = useCallback(async (address) => createUserAddress(address).then((res) => res.data), []);

  const getDisplayPrice = (ci) => ci.variant?.price || ci.item?.price || 0;
  const getDisplayTitle = (ci) => {
    let title = ci.item?.title || "Unknown Item";
    const specs = [];
    if (ci.variant?.color) specs.push(ci.variant.color);
    if (ci.variant?.size) specs.push(ci.variant.size);
    if (specs.length) title += ` (${specs.join(" - ")})`;
    return title;
  };
  const getDisplayImage = (ci) => {
    if (ci.variant?.image_url) return `${apiBaseUrl}${ci.variant.image_url}`;
    if (ci.variant?.images?.length) return `${apiBaseUrl}${ci.variant.images[0]}`;
    if (ci.item?.image_url) return `${apiBaseUrl}${ci.item.image_url}`;
    return "/api/placeholder/60/60";
  };

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (!validateCurrentStep()) {
        setError("Please select a valid payment option and complete payment.");
        return;
      }
      setIsSubmitting(true);
      setError("");
      try {
        const orderData = {
          items: cartItems.map((ci) => ({ item_id: ci.item_id, quantity: ci.quantity, variant_id: ci.variant_id })),
          shipping_address: formData.shipping,
          coupon_code: appliedCoupon?.code || null,
          shipping_charge: shippingCost,
          shipping_mode: shippingMode,
        };

        await createOrder(orderData);

        if (isAddingNewAddress) {
          const savedAddress = await saveNewAddress(formData.shipping);
          const updated = await getUserAddresses().then((res) => res.data);
          setSavedAddresses(updated);
          setSelectedAddressId(savedAddress.id);
          setIsAddingNewAddress(false);
        }

        await clearCart();
        setSuccessMessage("Order placed successfully!");
        setCompletedSteps((prev) => [...new Set([...prev, 3])]);
        setShowSuccessScreen(true);
      } catch (err) {
        setError("Failed to place order. Please try again.");
        console.error("Order error:", err);
      } finally {
        setIsSubmitting(false);
      }
    },
    [validateCurrentStep, clearCart, cartItems, formData.shipping, appliedCoupon, shippingCost, shippingMode, isAddingNewAddress, saveNewAddress]
  );

  /* ------------------------------ Success Screen ------------------------------ */
  const SuccessScreen = () => {
    const navigate = useNavigate();
    useEffect(() => {
      const t = setTimeout(() => navigate("/", { replace: true }), 4000);
      return () => clearTimeout(t);
    }, [navigate]);
    return (
      <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-6">
        <div className={`${ui.card} p-8 max-w-md w-full text-center`}>
          <div className="mx-auto mb-5 w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
            <svg className="w-9 h-9 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Confirmed</h2>
          <p className="text-gray-600 mb-6">{successMessage}</p>
          <button onClick={() => navigate("/", { replace: true })} className={ui.btnPrimary}>
            Continue Shopping
          </button>
        </div>
      </div>
    );
  };

  /* -------------------------- Saved Address Selection ------------------------- */
  const renderSavedAddressSelection = () => {
    if (!savedAddresses.length) return null;
    return (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className={ui.sectionTitle}>Select Delivery Address</h3>
          <button
            type="button"
            onClick={() => {
              setIsAddingNewAddress(true);
              setSelectedAddressId(null);
              setEditingAddress(null);
              setFormData((p) => ({
                ...p,
                shipping: { full_name: "", phone: "", address_line1: "", address_line2: "", city: "", state: "", postal_code: "", country: "India", is_default: false },
              }));
            }}
            className={ui.btnPrimary}
          >
            + Add New Address
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {savedAddresses.map((addr) => (
            <AddressCard
              key={addr.id}
              address={addr}
              isSelected={selectedAddressId === addr.id && !isAddingNewAddress}
              onSelect={() => {
                setSelectedAddressId(addr.id);
                setFormData((p) => ({ ...p, shipping: { ...addr } }));
                setIsAddingNewAddress(false);
                setEditingAddress(null);
              }}
              onEdit={(address) => {
                setEditingAddress(address);
                setFormData((p) => ({ ...p, shipping: { ...address } }));
                setIsAddingNewAddress(true);
              }}
            />
          ))}
        </div>

        {!isAddingNewAddress && (
          <div className="text-center mt-4">
            <button
              type="button"
              onClick={() => {
                setIsAddingNewAddress(true);
                setSelectedAddressId(null);
                setEditingAddress(null);
                setFormData((p) => ({
                  ...p,
                  shipping: { full_name: "", phone: "", address_line1: "", address_line2: "", city: "", state: "", postal_code: "", country: "India", is_default: false },
                }));
              }}
              className="text-blue-600 hover:text-blue-800 font-semibold"
            >
              + Add New Address
            </button>
          </div>
        )}
      </div>
    );
  };

  /* ------------------------------- Step UIs -------------------------------- */
  const renderShippingStep = () => (
    <>
      {renderSavedAddressSelection()}

      {(isAddingNewAddress || !savedAddresses.length) && (
        <div className={`${ui.card} p-6`}>
          <h3 className={ui.sectionTitle + " mb-4"}>{editingAddress ? "Edit Address" : "Add New Address"}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField section="shipping" field="full_name" label="Full Name" required placeholder="Enter your full name" value={formData.shipping.full_name} onChange={(e) => handleInputChange("shipping", "full_name", e.target.value)} error={shippingErrors.full_name} />
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Phone Number <span className="text-red-500 ml-1">*</span>
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-gray-300 bg-gray-100 text-gray-700 font-semibold select-none">+91</span>
                <input
                  type="tel"
                  name="phone"
                  value={formData.shipping.phone}
                  onChange={(e) => handleInputChange("shipping", "phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="1234567890"
                  maxLength={10}
                  required
                  className={`${ui.input} rounded-l-none`}
                  spellCheck={false}
                  autoComplete="off"
                  aria-invalid={!!shippingErrors.phone}
                />
              </div>
              {shippingErrors.phone && <p className="text-red-600 text-sm mt-2 font-semibold">{shippingErrors.phone}</p>}
            </div>

            <div className="md:col-span-2">
              <InputField section="shipping" field="address_line1" label="Street Address" required placeholder="House No., Building, Street, Area" value={formData.shipping.address_line1} onChange={(e) => handleInputChange("shipping", "address_line1", e.target.value)} error={shippingErrors.address_line1} />
            </div>

            <div className="md:col-span-2">
              <InputField section="shipping" field="address_line2" label="Landmark (Optional)" placeholder="Near landmark, opposite to..." value={formData.shipping.address_line2} onChange={(e) => handleInputChange("shipping", "address_line2", e.target.value)} />
            </div>

            <InputField section="shipping" field="city" label="City" required placeholder="Enter your city" value={formData.shipping.city} onChange={(e) => handleInputChange("shipping", "city", e.target.value)} error={shippingErrors.city} />
            <InputField section="shipping" field="state" label="State" required placeholder="Enter your state" value={formData.shipping.state} onChange={(e) => handleInputChange("shipping", "state", e.target.value)} error={shippingErrors.state} />
            <InputField section="shipping" field="postal_code" label="PIN Code" required placeholder="Enter PIN code" value={formData.shipping.postal_code} onChange={(e) => handleInputChange("shipping", "postal_code", e.target.value.toUpperCase())} error={shippingErrors.postal_code} />
            <InputField section="shipping" field="country" label="Country" required value={formData.shipping.country} onChange={(e) => handleInputChange("shipping", "country", e.target.value)} error={shippingErrors.country} disabled />
          </div>

          <div className="flex items-center gap-2 mt-2">
            <input type="checkbox" id="setDefault" checked={formData.shipping.is_default} onChange={(e) => handleInputChange("shipping", "is_default", e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
            <label htmlFor="setDefault" className="text-sm font-semibold text-gray-700">
              Set as default address
            </label>
          </div>
        </div>
      )}

      <ShippingModeSelector shippingMode={shippingMode} setShippingMode={setShippingMode} />
    </>
  );

  const renderPaymentStep = () => (
    <div className="space-y-6">
      <h3 className={ui.sectionTitle}>Select Payment Method</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { value: "cod", label: "Cash on Delivery", icon: "💰", description: "Pay when you receive your order" },
          { value: "upi", label: "UPI Payment", icon: "🧾", description: "Instant & secure UPI payment" },
        ].map((m) => (
          <label key={m.value} className={`${ui.card} p-5 cursor-pointer ${formData.payment.method === m.value ? "border-blue-500 bg-blue-50" : ""}`}>
            <input type="radio" name="paymentMethod" value={m.value} checked={formData.payment.method === m.value} onChange={() => handleInputChange("payment", "method", m.value)} className="hidden" />
            <div className="flex items-start gap-4">
              <span className="text-2xl">{m.icon}</span>
              <div>
                <p className="font-semibold text-gray-900">{m.label}</p>
                <p className="text-sm text-gray-600">{m.description}</p>
              </div>
            </div>
          </label>
        ))}
      </div>

      {formData.payment.method === "cod" && (
        <div className={`${ui.card} p-6`}>
          <p className="text-gray-700 font-semibold text-center">You will pay with cash when your order is delivered.</p>
        </div>
      )}

      {formData.payment.method === "upi" && (
        <UpiQrPayment
          merchantUpiId="merchant@upi"
          merchantName="Your Shop Name"
          amount={total.toFixed(2)}
          txnNote="Order Payment"
          onPaymentConfirmed={() => setUpiPaymentConfirmed(true)}
        />
      )}

      {formData.payment.method === "upi" && upiPaymentConfirmed && (
        <div className={`${ui.card} p-4 text-center`}>
          <span className={`${ui.badge} bg-emerald-100 text-emerald-700`}>UPI confirmed</span>
          <p className="text-gray-700 mt-2">You can now place your order.</p>
        </div>
      )}
    </div>
  );

  const renderReviewStep = () => (
    <div className="space-y-6">
      <div className={`${ui.card} p-6`}>
        <h3 className={ui.sectionTitle + " mb-3"}>Shipping Address</h3>
        <div className="flex items-start justify-between">
          <div className="space-y-1 text-gray-700">
            <p className="font-semibold text-gray-900">{formData.shipping.full_name}</p>
            <p>{formData.shipping.address_line1}</p>
            {formData.shipping.address_line2 && <p>{formData.shipping.address_line2}</p>}
            <p>
              {formData.shipping.city}, {formData.shipping.state} {formData.shipping.postal_code}
            </p>
            <p>{formData.shipping.country}</p>
            <p className="text-blue-600 font-semibold mt-1">📱 {formData.shipping.phone}</p>
          </div>
          <button type="button" onClick={() => setCurrentStep(1)} className="text-blue-600 hover:text-blue-800 font-semibold text-sm">
            Change
          </button>
        </div>
      </div>

      <div className={`${ui.card} p-6`}>
        <h3 className={ui.sectionTitle + " mb-3"}>Delivery</h3>
        <div className="flex items-center justify-between bg-gray-50 rounded-xl p-4 border border-gray-200">
          <p className="font-semibold text-gray-800">{shippingMode === "pickup" ? "Store pickup • Free" : "Home delivery • ₹9.99 (2–4 days)"}</p>
          <button type="button" onClick={() => setCurrentStep(1)} className="text-blue-600 hover:text-blue-800 text-sm font-semibold">
            Change
          </button>
        </div>
      </div>

      <div className={`${ui.card} p-6`}>
        <h3 className={ui.sectionTitle + " mb-3"}>Order Items</h3>
        <div className="space-y-3">
          {cartItems.map((ci) => (
            <div key={ci.id} className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl p-3">
              <div className="flex items-center gap-3">
                <img src={getDisplayImage(ci)} alt={getDisplayTitle(ci)} className="w-14 h-14 rounded-lg object-cover border border-gray-200" onError={(e) => (e.currentTarget.src = "/api/placeholder/60/60")} />
                <div>
                  <p className="font-semibold text-gray-900">{getDisplayTitle(ci)}</p>
                  <p className="text-xs text-gray-600">Qty: {ci.quantity}</p>
                </div>
              </div>
              <div className="font-bold text-gray-900">₹{(getDisplayPrice(ci) * ci.quantity).toFixed(2)}</div>
            </div>
          ))}
        </div>
      </div>

      <CouponSection appliedCoupon={appliedCoupon} onApplyCoupon={(code) => handleApplyCoupon(code, subtotal)} onRemoveCoupon={handleRemoveCoupon} subtotal={subtotal} isApplyingCoupon={isApplyingCoupon} />
    </div>
  );

  /* --------------------------------- Render -------------------------------- */
  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Page header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">Secure Checkout</h1>
            <p className="text-gray-600">Manage your purchase and complete your order</p>
          </div>
          <button onClick={() => navigate("/cart")} className={ui.btnSecondary}>
            Back to cart
          </button>
        </div>

        <ProgressSteps currentStep={currentStep} completedSteps={completedSteps} />

        {/* Alerts */}
        {couponMessage && (
          <div className="mb-4 px-4 py-3 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 font-semibold">
            {couponMessage}
          </div>
        )}
        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Main */}
            <section className={`${ui.card} xl:col-span-2 p-6`}>
              {currentStep === 1 && renderShippingStep()}
              {currentStep === 2 && renderReviewStep()}
              {currentStep === 3 && renderPaymentStep()}
            </section>

            {/* Summary */}
            <aside className={`${ui.card} p-6 h-fit sticky top-6`}>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h3>

              <div className="space-y-3 mb-5 max-h-72 overflow-y-auto">
                {cartItems.map((ci) => (
                  <div key={ci.id} className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl p-3">
                    <div className="flex items-center gap-3">
                      <img src={getDisplayImage(ci)} alt={getDisplayTitle(ci)} className="w-12 h-12 rounded-lg object-cover border border-gray-200" onError={(e) => (e.currentTarget.src = "/api/placeholder/50/50")} />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{getDisplayTitle(ci)}</p>
                        <p className="text-xs text-gray-600">Qty: {ci.quantity}</p>
                      </div>
                    </div>
                    <span className="font-bold text-gray-900">₹{(getDisplayPrice(ci) * ci.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-2 border-t pt-4">
                <div className="flex justify-between text-gray-700">
                  <span>Subtotal</span>
                  <span className="font-semibold">₹{subtotal.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount</span>
                    <span className="font-semibold">-₹{discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-700">
                  <span>Shipping</span>
                  <span className={`font-semibold ${shippingCost === 0 ? "text-emerald-700" : ""}`}>{shippingCost === 0 ? "Free" : `₹${shippingCost.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-gray-900 border-t pt-3">
                  <span>Total</span>
                  <span className="text-blue-700">₹{total.toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between gap-3">
                <button type="button" onClick={handleBack} disabled={currentStep === 1} className={`${ui.btnOutline} disabled:opacity-50`}>
                  Back
                </button>
                {currentStep < 3 ? (
                  <button type="button" onClick={handleNext} className={ui.btnPrimary}>
                    Continue
                  </button>
                ) : (
                  <button type="submit" disabled={isSubmitting || !cartItems.length} className={`${ui.btnPrimary} disabled:opacity-50`}>
                    {isSubmitting ? "Placing..." : `Place Order • ₹${total.toFixed(2)}`}
                  </button>
                )}
              </div>
            </aside>
          </div>
        </form>
      </div>

      {showSuccessScreen && <SuccessScreen />}
    </div>
  );
}