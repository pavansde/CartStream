import React, { useState, useContext, useMemo, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { CartContext } from "../context/CartContext";
import { UpiQrPayment } from "./UpiQrPayment";

// Memoized InputField preserves input focus between renders
const InputField = React.memo(({ 
  section, field, label, type = "text", required = false, 
  placeholder, value, onChange 
}) => (
  <div className="mb-6">
    <label className="block text-sm font-medium text-gray-700 mb-2">
      {label} {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    <input
      type={type}
      name={field}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 outline-none bg-white shadow-sm hover:border-gray-300"
      spellCheck={false}
      autoComplete="off"
    />
  </div>
));

// Memoized ProgressSteps with color-coded state
const ProgressSteps = React.memo(({ currentStep, completedSteps }) => (
  <div className="flex items-center justify-center space-x-8 max-w-2xl mx-auto mb-12">
    {[1, 2, 3].map(step => (
      <React.Fragment key={step}>
        <div className="flex flex-col items-center select-none cursor-default">
          <div
            className={`w-14 h-14 rounded-full flex items-center justify-center text-lg font-semibold transition-colors duration-300 ${
              completedSteps.includes(step)
                ? "bg-green-500 text-white shadow-lg"
                : currentStep === step
                ? "bg-blue-600 text-white shadow-lg scale-110"
                : "bg-gray-300 text-gray-600"
            }`}
          >
            {completedSteps.includes(step) ? "✓" : step}
          </div>
          <span className="mt-3 text-sm font-medium text-gray-800">
            {step === 1 ? "Shipping" : step === 2 ? "Review" : "Payment"}
          </span>
        </div>
        {step < 3 && (
          <div
            className={`w-24 h-1 mx-2 transition-all duration-300 ${
              completedSteps.includes(step) ? "bg-green-500" : "bg-gray-200"
            }`}
          />
        )}
      </React.Fragment>
    ))}
  </div>
));

export default function CustomerCheckout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { cartItems: contextCartItems = [] } = useContext(CartContext);
  const cartItems = location.state?.cartItems || contextCartItems;

  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState([]);

  const [formData, setFormData] = useState({
    shipping: {
      fullName: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      postalCode: "",
      country: "",
      phone: "",
    },
    payment: {
      method: ""
    },
  });

  const [upiPaymentConfirmed, setUpiPaymentConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showSuccessScreen, setShowSuccessScreen] = useState(false);

  // Ignore tax, calculate subtotal and shipping only
  const { subtotal, shippingCost, total } = useMemo(() => {
    const calcSubtotal = Array.isArray(cartItems)
      ? cartItems.reduce(
          (sum, { item, quantity }) => sum + (item?.price || 0) * quantity,
          0
        )
      : 0;
    const ship = 9.99;
    const totalAmt = calcSubtotal + ship;
    return {
      subtotal: Math.max(0, calcSubtotal),
      shippingCost: ship,
      total: Math.max(0, totalAmt),
    };
  }, [cartItems]);

  const handleInputChange = useCallback((section, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  }, []);

  const validateCurrentStep = useCallback(() => {
  if (currentStep === 1) {
    const requiredFields = [
      "fullName",
      "addressLine1",
      "city",
      "state",
      "postalCode",
      "country",
      "phone",
    ];
    return requiredFields.every(
      (field) => formData.shipping[field]?.trim().length > 0
    );
  }
  if (currentStep === 2) {
    // Review step, no input fields to validate
    return true;
  }
  if (currentStep === 3) {
    if (!formData.payment.method) {
      return false; // Payment method must be selected
    }
    if (formData.payment.method === "upi" && !upiPaymentConfirmed) {
      return false; // Require UPI payment confirmation
    }
    // Add other payment validations here if needed (e.g. card fields etc.)
    return true;
  }
  return true; // default true for any other steps (if any)
}, [currentStep, formData, upiPaymentConfirmed]);


  const handleNext = useCallback(() => {
    if (!validateCurrentStep()) {
      setError(
        `Please fill in all required ${
          currentStep === 1 ? "shipping" : "payment"
        } details`
      );
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
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setSuccessMessage(
        "Order placed successfully! Confirmation email will be sent."
      );
      setCompletedSteps((prev) => [...new Set([...prev, 3])]);
      setShowSuccessScreen(true);
    } catch {
      setError("Failed to place order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  },
  [validateCurrentStep]
);

  // Success Screen with fade-in animation
  const SuccessScreen = () => (
  <div className="fixed inset-0 bg-white flex flex-col items-center justify-center text-green-700 font-semibold text-2xl animate-fadeIn z-50 p-8">
    <svg
      className="w-20 h-20 mb-6"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
    <p>Order placed successfully!</p>
    <p>You will receive a confirmation email shortly.</p>
    <button
      onClick={() => navigate("/", { replace: true })}
      className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
    >
      Continue
    </button>
  </div>
);


  const renderShippingStep = () => (
    <>
      <InputField
        section="shipping"
        field="fullName"
        label="Full Name"
        required
        placeholder="John Doe"
        value={formData.shipping.fullName}
        onChange={(e) =>
          handleInputChange("shipping", "fullName", e.target.value)
        }
      />
      <InputField
        section="shipping"
        field="phone"
        label="Phone Number"
        type="tel"
        required
        placeholder="+1 (555) 123-4567"
        value={formData.shipping.phone}
        onChange={(e) => handleInputChange("shipping", "phone", e.target.value)}
      />
      <InputField
        section="shipping"
        field="addressLine1"
        label="Street Address"
        required
        placeholder="123 Main Street"
        value={formData.shipping.addressLine1}
        onChange={(e) =>
          handleInputChange("shipping", "addressLine1", e.target.value)
        }
      />
      <InputField
        section="shipping"
        field="addressLine2"
        label="Apartment, Suite (Optional)"
        placeholder="Apt 4B"
        value={formData.shipping.addressLine2}
        onChange={(e) =>
          handleInputChange("shipping", "addressLine2", e.target.value)
        }
      />
      <InputField
        section="shipping"
        field="city"
        label="City"
        required
        placeholder="New York"
        value={formData.shipping.city}
        onChange={(e) => handleInputChange("shipping", "city", e.target.value)}
      />
      <InputField
        section="shipping"
        field="state"
        label="State"
        required
        placeholder="NY"
        value={formData.shipping.state}
        onChange={(e) => handleInputChange("shipping", "state", e.target.value)}
      />
      <InputField
        section="shipping"
        field="postalCode"
        label="ZIP Code"
        required
        placeholder="10001"
        value={formData.shipping.postalCode}
        onChange={(e) =>
          handleInputChange("shipping", "postalCode", e.target.value)
        }
      />
      <InputField
        section="shipping"
        field="country"
        label="Country"
        required
        placeholder="United States"
        value={formData.shipping.country}
        onChange={(e) =>
          handleInputChange("shipping", "country", e.target.value)
        }
      />
    </>
  );

  const renderPaymentStep = () => (
    <>
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { value: "cod", label: "Cash on Delivery", icon: "💰" },
          { value: "upi", label: "UPI", icon: "🧾" },
        ].map((method) => (
          <label
            key={method.value}
            className={`cursor-pointer p-6 border rounded-xl flex flex-col items-center transition-colors duration-200 ${
              formData.payment.method === method.value
                ? "border-blue-600 bg-blue-50 shadow-lg"
                : "border-gray-300 hover:border-gray-400"
            }`}
          >
            <input
              type="radio"
              name="paymentMethod"
              value={method.value}
              checked={formData.payment.method === method.value}
              onChange={() => handleInputChange("payment", "method", method.value)}
              className="hidden"
            />
            <span className="text-3xl mb-3">{method.icon}</span>
            <span className="font-semibold text-gray-900">{method.label}</span>
          </label>
        ))}
      </div>


      {formData.payment.method === "cod" && (
        <div className="text-center py-10 text-gray-700 text-lg">
          You will pay with cash on delivery.
        </div>
      )}

      {formData.payment.method === "upi" && (
        <UpiQrPayment
          merchantUpiId="merchant@upi" // Replace with your merchant UPI ID
          merchantName="Your Shop Name"
          amount={total.toFixed(2)}
          txnNote="Order Payment"
          onPaymentConfirmed={() => setUpiPaymentConfirmed(true)}
        />
      )}

      {formData.payment.method === "upi" && upiPaymentConfirmed && (
        <div className="text-green-700 font-semibold mt-4 text-center">
          UPI Payment confirmed! You can now place your order.
        </div>
      )}
    </>
  );

  const renderReviewStep = () => (
    <>
      <h3 className="text-xl font-bold mb-4">Shipping Address</h3>
      <div className="bg-gray-50 p-4 rounded-lg mb-8">
        <p>{formData.shipping.fullName}</p>
        <p>{formData.shipping.addressLine1}</p>
        {formData.shipping.addressLine2 && <p>{formData.shipping.addressLine2}</p>}
        <p>
          {formData.shipping.city}, {formData.shipping.state} {formData.shipping.postalCode}
        </p>
        <p>{formData.shipping.country}</p>
        <p>{formData.shipping.phone}</p>
      </div>


      <h3 className="text-xl font-bold mb-4">Order Items</h3>
      <div className="space-y-4 mb-8">
        {cartItems.map(({ item, quantity }) => (
          <div key={item.id} className="flex justify-between border-b border-gray-100 py-3">
            <div>
              {quantity} × {item.title}
            </div>
            <div className="font-semibold">₹{(item.price * quantity).toFixed(2)}</div>
          </div>
        ))}
      </div>

      <div className="border-t pt-4 space-y-2">
        <div className="flex justify-between text-gray-700">
          <span>Subtotal</span>
          <span>₹{subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-gray-700">
          <span>Shipping</span>
          <span>₹{shippingCost.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-lg font-bold border-t pt-2">
          <span>Total</span>
          <span>₹{total.toFixed(2)}</span>
        </div>
      </div>
    </>
  );
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8 px-4 sm:px-6 lg:px-8 relative">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-center text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-12">
          Secure Checkout
        </h1>

        <ProgressSteps currentStep={currentStep} completedSteps={completedSteps} />

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <section className="lg:col-span-2 bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
              {currentStep === 1 && renderShippingStep()}
              {currentStep === 2 && renderReviewStep()}
              {currentStep === 3 && renderPaymentStep()}
              
            </section>

            {/* Sidebar omitted for brevity, keep your order summary sidebar here */}
          </div>

          {/* Show error & success messages as usual */}

          <div className="mt-8 flex justify-between max-w-6xl mx-auto px-8">
            <button
              type="button"
              onClick={handleBack}
              disabled={currentStep === 1}
              className="px-8 py-3 border border-gray-300 text-gray-700 rounded-2xl font-semibold hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Back
            </button>

            {currentStep < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-semibold hover:bg-blue-700 shadow-lg transition-colors"
              >
                Continue
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting || cartItems.length === 0}
                className="px-8 py-3 bg-green-600 text-white rounded-2xl font-semibold hover:bg-green-700 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? "Placing Order..." : `Place Order • ₹${total.toFixed(2)}`}
              </button>
            )}
          </div>
        </form>
      </div>

      {showSuccessScreen && <SuccessScreen />}
    </div>
  );
}