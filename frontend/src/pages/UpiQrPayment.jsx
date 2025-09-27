import React, { useState } from "react";
import { QRCodeCanvas } from "qrcode.react";

export function UpiQrPayment({ merchantUpiId, merchantName, amount, txnNote, onPaymentConfirmed }) {
  const [isPaid, setIsPaid] = useState(false);

  const qrValue = `upi://pay?pa=${merchantUpiId}&pn=${encodeURIComponent(
    merchantName
  )}&am=${amount}&cu=INR&tn=${encodeURIComponent(txnNote)}`;

  const handlePaymentComplete = () => {
    setIsPaid(true);
    if (onPaymentConfirmed) onPaymentConfirmed();
  };

  return (
    <div className="p-6 bg-white rounded-2xl shadow-md text-center">
      {!isPaid ? (
        <>
          <p className="mb-4 text-lg font-medium">Scan this QR code using your UPI app to pay</p>
          <div className="inline-block p-4 bg-gray-50 rounded-xl">
            <QRCodeCanvas value={qrValue} size={220} />
          </div>
          <button
            onClick={handlePaymentComplete}
            className="mt-6 px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition"
          >
            Payment Completed
          </button>
        </>
      ) : (
        <p className="text-green-700 font-semibold text-lg">Payment successful! Thank you for your order.</p>
      )}
    </div>
  );
}
