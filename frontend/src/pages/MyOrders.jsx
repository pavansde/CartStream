// import React, { useEffect, useState } from "react";
// import { getMyOrders, getOrderInvoice } from "../api/orders";
// import { addOrUpdateCartItem } from "../api/cart";
// import { useNavigate } from "react-router-dom";


// const getAuthToken = () => localStorage.getItem("authToken");

// export default function MyOrders() {
//   const [orders, setOrders] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");
//   const [reordering, setReordering] = useState(false);
//   const [viewingInvoice, setViewingInvoice] = useState(null);
//   const [downloadingInvoice, setDownloadingInvoice] = useState(null);
//   const [invoiceModal, setInvoiceModal] = useState({ isOpen: false, data: null });
//   const navigate = useNavigate();

//   useEffect(() => {
//     const fetchOrders = async () => {
//       setLoading(true);
//       try {
//         const res = await getMyOrders();
//         setOrders(res.data);
//       } catch (err) {
//         setError("Failed to load your orders.");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchOrders();
//   }, []);

//   const handleOrderAgain = async (order) => {
//     setReordering(true);
//     const authToken = getAuthToken();
//     try {
//       for (const item of order.items) {
//         const data = {
//           item_id: item.item_id,
//           quantity: item.quantity,
//         };
//         await addOrUpdateCartItem(data, authToken);
//       }
//       navigate("/cart");
//     } catch (err) {
//       alert("Failed to reorder items. Please try again.");
//     } finally {
//       setReordering(false);
//     }
//   };

//   const handleViewInvoice = async (order) => {
//     setViewingInvoice(order.id);
//     try {
//       const response = await getOrderInvoice(order.id, { responseType: 'blob' });

//       const invoiceData = response.data;
      
//       if (invoiceData) {
//         setInvoiceModal({ isOpen: true, data: invoiceData });
//       } else {
//         alert('Unable to load invoice data.');
//       }
//     } catch (err) {
//       alert('Failed to load invoice. Please try again.');
//     } finally {
//       setViewingInvoice(null);
//     }
//   };

//   const handleDownloadInvoice = async (order) => {
//     setDownloadingInvoice(order.id);
//     try {
//       const response = await getOrderInvoice(order.id);
//       const invoiceData = response.data;
      
//       if (invoiceData) {
//         // Create a downloadable JSON file
//         const blob = new Blob([JSON.stringify(invoiceData, null, 2)], { 
//           type: 'application/json' 
//         });
//         const url = URL.createObjectURL(blob);
//         const a = document.createElement('a');
//         a.href = url;
//         a.download = `invoice-${order.id}.json`;
//         document.body.appendChild(a);
//         a.click();
//         document.body.removeChild(a);
//         URL.revokeObjectURL(url);
//       } else {
//         alert('Unable to generate invoice.');
//       }
//     } catch (err) {
//       alert('Failed to download invoice. Please try again.');
//     } finally {
//       setDownloadingInvoice(null);
//     }
//   };

//   const closeInvoiceModal = () => {
//     setInvoiceModal({ isOpen: false, data: null });
//   };

//   // Invoice Modal Component
//   const InvoiceModal = ({ isOpen, data, onClose }) => {
//     if (!isOpen || !data) return null;

//     return (
//       <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
//         <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
//           {/* Modal Header */}
//           <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gray-50">
//             <h2 className="text-2xl font-bold text-gray-900">Invoice #{data.order_id}</h2>
//             <button
//               onClick={onClose}
//               className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
//             >
//               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//               </svg>
//             </button>
//           </div>

//           {/* Modal Content */}
//           <div className="flex-1 overflow-y-auto p-6">
//             {/* Invoice Header */}
//             <div className="border-b border-gray-200 pb-6 mb-6">
//               <div className="flex justify-between items-start">
//                 <div>
//                   <p className="text-sm text-gray-600">Order Date</p>
//                   <p className="text-lg font-semibold text-gray-900">
//                     {new Date(data.order_date).toLocaleDateString()}
//                   </p>
//                 </div>
//                 <span className={`px-3 py-1 rounded-full text-sm font-medium ${
//                   data.status === "Delivered" ? "bg-green-100 text-green-800" :
//                   data.status === "Pending" ? "bg-yellow-100 text-yellow-800" :
//                   "bg-blue-100 text-blue-800"
//                 }`}>
//                   {data.status}
//                 </span>
//               </div>
//             </div>

//             {/* Customer and Shipping Info */}
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
//               <div className="bg-gray-50 p-4 rounded-lg">
//                 <h3 className="text-lg font-semibold text-gray-900 mb-3">Customer Information</h3>
//                 <p className="text-sm text-gray-700"><strong>Name:</strong> {data.customer?.name || 'N/A'}</p>
//                 <p className="text-sm text-gray-700"><strong>Email:</strong> {data.customer?.email || 'N/A'}</p>
//                 <p className="text-sm text-gray-700"><strong>Phone:</strong> {data.customer?.phone || 'N/A'}</p>
//               </div>

//               <div className="bg-gray-50 p-4 rounded-lg">
//                 <h3 className="text-lg font-semibold text-gray-900 mb-3">Shipping Address</h3>
//                 <p className="text-sm text-gray-700"><strong>Name:</strong> {data.shipping_address?.full_name || 'N/A'}</p>
//                 <p className="text-sm text-gray-700"><strong>Phone:</strong> {data.shipping_address?.phone || 'N/A'}</p>
//                 <p className="text-sm text-gray-700">
//                   <strong>Address:</strong> {data.shipping_address?.address_line1 || ''} {data.shipping_address?.address_line2 || ''}
//                 </p>
//                 <p className="text-sm text-gray-700">
//                   <strong>City:</strong> {data.shipping_address?.city || 'N/A'}, {data.shipping_address?.state || 'N/A'} {data.shipping_address?.postal_code || 'N/A'}
//                 </p>
//                 <p className="text-sm text-gray-700"><strong>Country:</strong> {data.shipping_address?.country || 'N/A'}</p>
//               </div>
//             </div>

//             {/* Order Items */}
//             <div className="mb-6">
//               <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h3>
//               <div className="overflow-x-auto">
//                 <table className="w-full border-collapse border border-gray-200">
//                   <thead>
//                     <tr className="bg-gray-50">
//                       <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-700">Item</th>
//                       <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-700">Unit Price</th>
//                       <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-700">Quantity</th>
//                       <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-700">Total</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {data.items?.map((item, index) => (
//                       <tr key={index} className="hover:bg-gray-50">
//                         <td className="border border-gray-200 px-4 py-3 text-sm text-gray-700">{item.item_title || 'Unknown Item'}</td>
//                         <td className="border border-gray-200 px-4 py-3 text-sm text-gray-700">₹{item.unit_price ? item.unit_price.toFixed(2) : '0.00'}</td>
//                         <td className="border border-gray-200 px-4 py-3 text-sm text-gray-700">{item.quantity || 0}</td>
//                         <td className="border border-gray-200 px-4 py-3 text-sm text-gray-700 font-semibold">₹{item.line_total_price ? item.line_total_price.toFixed(2) : '0.00'}</td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//             </div>

//             {/* Total and Coupon */}
//             <div className="border-t border-gray-200 pt-6">
//               <div className="flex justify-between items-center mb-4">
//                 <span className="text-xl font-semibold text-gray-900">Total Amount:</span>
//                 <span className="text-2xl font-bold text-gray-900">₹{data.total_price ? data.total_price.toFixed(2) : '0.00'}</span>
//               </div>

//               {data.coupon && (
//                 <div className="bg-green-50 border border-green-200 rounded-lg p-4">
//                   <h4 className="text-lg font-semibold text-green-800 mb-2">Discount Applied</h4>
//                   <p className="text-sm text-green-700"><strong>Coupon Code:</strong> {data.coupon.code}</p>
//                   <p className="text-sm text-green-700"><strong>Discount Type:</strong> {data.coupon.discount_type}</p>
//                   <p className="text-sm text-green-700">
//                     <strong>Discount Value:</strong> {data.coupon.discount_type === 'percentage' ? 
//                       data.coupon.discount_value + '%' : 
//                       '₹' + data.coupon.discount_value.toFixed(2)}
//                   </p>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   };


//   return (
//     <div className="min-h-screen bg-gray-50 py-4">
//       <div className="max-w-4xl mx-auto px-2 sm:px-2 lg:px-14">
//         {/* Header */}
//         <div className="mb-8 text-center sm:text-left">
//           <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
//           <p className="mt-2 text-gray-600">View your order history and track your purchases</p>
//         </div>

//         {orders.length === 0 ? (
//           <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
//             <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
//               <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
//               </svg>
//             </div>
//             <h3 className="text-xl font-semibold text-gray-900 mb-2">No orders yet</h3>
//             <p className="text-gray-600 max-w-md mx-auto">
//               You have no orders placed yet. Start shopping to see your order history here.
//             </p>
//           </div>
//         ) : (
//           <div className="space-y-6">
//             {orders.map((order) => (
//               <div
//                 key={order.id}
//                 className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 overflow-hidden"
//               >
//                 {/* Order Header */}
//                 <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
//                   <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
//                     <div className="flex items-center gap-4">
//                       <div>
//                         <p className="text-sm font-medium text-gray-500">Order ID</p>
//                         <p className="text-lg font-bold text-gray-900">#{order.id}</p>
//                       </div>
//                     </div>
//                     <span
//                       className={`px-4 py-2 rounded-full text-sm font-semibold capitalize ${
//                         order.status === "Delivered"
//                           ? "bg-green-100 text-green-800 border border-green-200"
//                           : order.status === "Pending"
//                           ? "bg-yellow-100 text-yellow-800 border border-yellow-200"
//                           : "bg-blue-100 text-blue-800 border border-blue-200"
//                       }`}
//                     >
//                       {order.status}
//                     </span>
//                   </div>
//                 </div>

//                 {/* Order Items */}
//                 <div className="p-6">
//                   <h3 className="text-lg font-semibold text-gray-900 mb-4">Items Ordered</h3>
//                   <div className="space-y-4">
//                     {order.items.length > 0 ? (
//                       order.items.map((item, index) => {
//                         const imageUrl = `http://127.0.0.1:8000${item.image_url}`;
//                         return (
//                           <div
//                             key={item.id ?? item.item_id ?? index}
//                             className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg border border-gray-100"
//                           >
//                             <img
//                               src={imageUrl}
//                               alt={item.item_title || "Product image"}
//                               className="w-16 h-16 object-cover rounded-lg bg-white border border-gray-200"
//                               onError={(e) => {
//                                 e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239CA3AF'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' /%3E%3C/svg%3E";
//                               }}
//                             />
//                             <div className="flex-1 min-w-0">
//                               <h4 className="text-base font-medium text-gray-900 truncate">
//                                 {item.item_title || "Unknown item"}
//                               </h4>
//                               <div className="flex items-center gap-4 mt-2">
//                                 <span className="text-sm text-gray-600">Qty: {item.quantity}</span>
//                                 <span className="text-sm font-semibold text-gray-900">
//                                   ₹{item.line_total_price != null ? item.line_total_price.toFixed(2) : "N/A"}
//                                 </span>
//                               </div>
//                             </div>
//                           </div>
//                         );
//                       })
//                     ) : (
//                       <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
//                         <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
//                         </svg>
//                         No items found
//                       </div>
//                     )}
//                   </div>

//                   {/* Order Total */}
//                   <div className="mt-6 pt-6 border-t border-gray-200">
//                     <div className="flex justify-between items-center">
//                       <span className="text-lg font-semibold text-gray-900">Total Amount:</span>
//                       <span className="text-xl font-bold text-gray-900">
//                         {order.total_price != null ? `₹${order.total_price.toFixed(2)}` : "N/A"}
//                       </span>
//                     </div>
//                   </div>

//                   {/* Action Buttons - Compact Layout */}
//                   <div className="mt-6 space-y-3">
//                     {/* Primary Action - Full Width */}
//                     <button
//                       className={`group relative w-full px-4 py-3 rounded-lg font-semibold text-base transition-all duration-200 transform hover:scale-[1.01] ${
//                         reordering
//                           ? "bg-gray-400 cursor-not-allowed text-gray-700 shadow-inner"
//                           : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg active:scale-99"
//                       }`}
//                       onClick={() => handleOrderAgain(order)}
//                       disabled={reordering}
//                     >
//                       {reordering ? (
//                         <span className="inline-flex items-center justify-center gap-2">
//                           <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
//                           <span className="font-medium">Adding Items to Cart...</span>
//                         </span>
//                       ) : (
//                         <span className="inline-flex items-center justify-center gap-2">
//                           <svg className="w-5 h-5 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
//                           </svg>
//                           Order All Items Again
//                         </span>
//                       )}
//                     </button>

//                     {/* Secondary Actions - Side by Side */}
//                     <div className="grid grid-cols-2 gap-3">
//                       <button
//                         onClick={() => handleViewInvoice(order)}
//                         disabled={viewingInvoice === order.id}
//                         className="group px-4 py-2.5 border-2 border-gray-300 rounded-lg text-gray-700 font-semibold hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700 transition-all duration-200 transform hover:scale-[1.01] active:scale-99 disabled:opacity-50 disabled:cursor-not-allowed"
//                       >
//                         {viewingInvoice === order.id ? (
//                           <span className="inline-flex items-center justify-center gap-2 text-sm">
//                             <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
//                             Loading...
//                           </span>
//                         ) : (
//                           <span className="inline-flex items-center justify-center gap-2 text-sm">
//                             <svg className="w-4 h-4 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
//                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
//                             </svg>
//                             View Invoice
//                           </span>
//                         )}
//                       </button>

//                       <button
//                         onClick={() => handleDownloadInvoice(order)}
//                         disabled={downloadingInvoice === order.id}
//                         className="group px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-[1.01] active:scale-99 disabled:opacity-50 disabled:cursor-not-allowed"
//                       >
//                         {downloadingInvoice === order.id ? (
//                           <span className="inline-flex items-center justify-center gap-2 text-sm">
//                             <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
//                             Preparing...
//                           </span>
//                         ) : (
//                           <span className="inline-flex items-center justify-center gap-2 text-sm">
//                             <svg className="w-4 h-4 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
//                             </svg>
//                             Download
//                           </span>
//                         )}
//                       </button>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}

//         {/* Invoice Modal */}
//         <InvoiceModal 
//           isOpen={invoiceModal.isOpen} 
//           data={invoiceModal.data} 
//           onClose={closeInvoiceModal} 
//         />
//       </div>
//     </div>
//   );
// }

import React, { useEffect, useState } from "react";
import { getMyOrders, getOrderInvoice } from "../api/orders";
import { addOrUpdateCartItem } from "../api/cart";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import "jspdf-autotable";

const getAuthToken = () => localStorage.getItem("authToken");

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reordering, setReordering] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState(null);
  const [downloadingInvoice, setDownloadingInvoice] = useState(null);
  const [invoiceModal, setInvoiceModal] = useState({ isOpen: false, data: null });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const res = await getMyOrders();
        setOrders(res.data);
      } catch (err) {
        setError("Failed to load your orders.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const handleOrderAgain = async (order) => {
    setReordering(true);
    const authToken = getAuthToken();
    try {
      for (const item of order.items) {
        const data = {
          item_id: item.item_id,
          quantity: item.quantity,
        };
        await addOrUpdateCartItem(data, authToken);
      }
      navigate("/cart");
    } catch (err) {
      alert("Failed to reorder items. Please try again.");
    } finally {
      setReordering(false);
    }
  };

  const handleViewInvoice = async (order) => {
    setViewingInvoice(order.id);
    try {
      const response = await getOrderInvoice(order.id);
      const invoiceData = response.data;
      
      if (invoiceData) {
        setInvoiceModal({ isOpen: true, data: invoiceData });
      } else {
        alert('Unable to load invoice data.');
      }
    } catch (err) {
      alert('Failed to load invoice. Please try again.');
    } finally {
      setViewingInvoice(null);
    }
  };

  const generatePDF = (invoiceData) => {
  const doc = new jsPDF({
    unit: "pt", // Points for finer precision
    format: "a4",
  });

  // --- Color Palette ---
  const primary = [37, 99, 235]; // blue-600
  const dark = [30, 41, 59]; // slate-800
  const gray = [100, 116, 139]; // slate-500
  const light = [248, 250, 252]; // slate-50
  const border = [226, 232, 240]; // slate-200
  const success = [16, 185, 129];
  const warning = [245, 158, 11];
  const danger = [239, 68, 68];

  // --- Dimensions ---
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;

  // --- HEADER ---
  doc.setFillColor(...primary);
  doc.rect(0, 0, pageWidth, 80, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.text("INVOICE", margin, 45);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text("Your Store Name", margin, 63);
  doc.setFontSize(9);
  doc.text("Professional E-commerce Solutions", margin, 77);

  // --- Invoice Info (top right) ---
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(`INVOICE #${invoiceData.order_id}`, pageWidth - margin, 40, { align: "right" });

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const formattedDate = new Date(invoiceData.order_date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  doc.text(`Date: ${formattedDate}`, pageWidth - margin, 55, { align: "right" });
  doc.text(`Due: Upon Receipt`, pageWidth - margin, 68, { align: "right" });

  // --- STATUS BADGE ---
  const statusColor =
    invoiceData.status === "Delivered"
      ? success
      : invoiceData.status === "Pending"
      ? warning
      : primary;

  doc.setFillColor(...statusColor);
  doc.roundedRect(pageWidth - margin - 60, 85, 60, 18, 4, 4, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(invoiceData.status.toUpperCase(), pageWidth - margin - 30, 98, {
    align: "center",
  });

  // --- BILL TO / SHIP TO ---
  const infoY = 120;
  const colGap = 20;
  const colWidth = (contentWidth - colGap) / 2;

  doc.setTextColor(...dark);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("BILL TO", margin, infoY);
  doc.text("SHIP TO", margin + colWidth + colGap, infoY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...gray);

  const customerInfo = [
    invoiceData.customer?.name,
    invoiceData.customer?.email,
    invoiceData.customer?.phone,
  ].filter(Boolean);

  const shipping = invoiceData.shipping_address || {};
  const shippingInfo = [
    shipping.full_name,
    shipping.phone,
    `${shipping.address_line1 || ""} ${shipping.address_line2 || ""}`.trim(),
    `${shipping.city || ""}, ${shipping.state || ""} ${shipping.postal_code || ""}`,
    shipping.country,
  ].filter(Boolean);

  customerInfo.forEach((line, i) => {
    doc.text(line, margin, infoY + 15 + i * 12);
  });

  shippingInfo.forEach((line, i) => {
    doc.text(line, margin + colWidth + colGap, infoY + 15 + i * 12);
  });

  // --- ITEMS TABLE ---
  let tableY = infoY + 90;

  const columns = [
    { label: "DESCRIPTION", width: 220, align: "left" },
    { label: "UNIT PRICE", width: 80, align: "right" },
    { label: "QTY", width: 40, align: "center" },
    { label: "TOTAL", width: 80, align: "right" },
  ];

  const drawTableHeader = (y) => {
    doc.setFillColor(...dark);
    doc.rect(margin, y, contentWidth, 18, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);

    let x = margin + 10;
    columns.forEach((col) => {
      doc.text(col.label, x, y + 12, { align: col.align });
      x += col.width;
    });
  };

  const drawRow = (item, y, index) => {
    const rowHeight = 20;
    if (index % 2 === 0) {
      doc.setFillColor(...light);
      doc.rect(margin, y - 10, contentWidth, rowHeight, "F");
    }

    doc.setTextColor(...dark);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);

    const unitPrice = parseFloat(item.unit_price) || 0;
    const qty = item.quantity || 1;
    const total = parseFloat(item.line_total_price) || unitPrice * qty;

    let x = margin + 10;
    doc.text(item.item_title || "Item", x, y, { align: "left" });
    x += columns[0].width;
    doc.setTextColor(...gray);
    doc.text(`₹${unitPrice.toFixed(2)}`, x, y, { align: "right" });
    x += columns[1].width;
    doc.text(`${qty}`, x, y, { align: "center" });
    x += columns[2].width;
    doc.setTextColor(...dark);
    doc.setFont("helvetica", "bold");
    doc.text(`₹${total.toFixed(2)}`, x, y, { align: "right" });

    return rowHeight;
  };

  // --- Draw Table ---
  drawTableHeader(tableY);
  tableY += 28;

  let subtotal = 0;

  invoiceData.items?.forEach((item, i) => {
    const rowHeight = 22;
    if (tableY + rowHeight > pageHeight - 150) {
      // Add new page if needed
      doc.addPage();
      tableY = margin;
      drawTableHeader(tableY);
      tableY += 28;
    }

    tableY += drawRow(item, tableY, i);
    subtotal += parseFloat(item.line_total_price) || item.unit_price * item.quantity;
  });

  // --- SUMMARY BOX ---
  const summaryY = tableY + 30;
  const summaryBoxX = pageWidth - margin - 180;

  doc.setDrawColor(...border);
  doc.roundedRect(summaryBoxX - 10, summaryY - 10, 190, 80, 4, 4, "D");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...gray);

  let y = summaryY;
  doc.text("Subtotal:", summaryBoxX + 80, y, { align: "right" });
  doc.text(`₹${subtotal.toFixed(2)}`, pageWidth - margin, y, { align: "right" });
  y += 14;

  let discount = 0;
  if (invoiceData.coupon) {
    const c = invoiceData.coupon;
    discount =
      c.discount_type === "percentage"
        ? subtotal * (c.discount_value / 100)
        : Math.min(subtotal, c.discount_value);

    doc.text("Discount:", summaryBoxX + 80, y, { align: "right" });
    doc.setTextColor(...danger);
    doc.text(`-₹${discount.toFixed(2)}`, pageWidth - margin, y, { align: "right" });
    doc.setTextColor(...gray);
    y += 14;
  }

  doc.setDrawColor(...border);
  doc.line(summaryBoxX - 10, y - 5, pageWidth - margin, y - 5);

  const total = parseFloat(invoiceData.total_price) || subtotal - discount;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...dark);
  doc.text("Total:", summaryBoxX + 80, y + 12, { align: "right" });
  doc.text(`₹${total.toFixed(2)}`, pageWidth - margin, y + 12, { align: "right" });

  // --- FOOTER ---
  const footerY = pageHeight - 60;
  doc.setDrawColor(...border);
  doc.line(margin, footerY, pageWidth - margin, footerY);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(...gray);
  doc.setFontSize(8);
  const footer = [
    "Thank you for your business!",
    "For questions, reach out to support@yourstore.com | +91 XXX-XXX-XXXX",
    "Your Store Name – Professional E-commerce Solutions",
  ];

  footer.forEach((t, i) => {
    doc.text(t, pageWidth / 2, footerY + 15 + i * 10, { align: "center" });
  });

  return doc;
};


const handleDownloadInvoice = async (order) => {
  setDownloadingInvoice(order.id);
  try {
    const response = await getOrderInvoice(order.id);
    const invoiceData = response.data;
    
    if (invoiceData) {
      // Add a small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 500));
      const pdfDoc = generatePDF(invoiceData);
      pdfDoc.save(`invoice-${order.id}.pdf`);
    } else {
      alert('Unable to generate invoice.');
    }
  } catch (err) {
    console.error('PDF generation error:', err);
    alert('Failed to download invoice. Please try again.');
  } finally {
    setDownloadingInvoice(null);
  }
};

  const closeInvoiceModal = () => {
    setInvoiceModal({ isOpen: false, data: null });
  };

  // Invoice Modal Component (same as before)
  const InvoiceModal = ({ isOpen, data, onClose }) => {
    if (!isOpen || !data) return null;

    const handleDownloadFromModal = () => {
      const pdfDoc = generatePDF(data);
      pdfDoc.save(`invoice-${data.order_id}.pdf`);
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* Modal Header */}
          <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gray-50">
            <h2 className="text-2xl font-bold text-gray-900">Invoice #{data.order_id}</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Modal Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Invoice Header */}
            <div className="border-b border-gray-200 pb-6 mb-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-600">Order Date</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {new Date(data.order_date).toLocaleDateString()}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  data.status === "Delivered" ? "bg-green-100 text-green-800" :
                  data.status === "Pending" ? "bg-yellow-100 text-yellow-800" :
                  "bg-blue-100 text-blue-800"
                }`}>
                  {data.status}
                </span>
              </div>
            </div>

            {/* Customer and Shipping Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Customer Information</h3>
                <p className="text-sm text-gray-700"><strong>Name:</strong> {data.customer?.name || 'N/A'}</p>
                <p className="text-sm text-gray-700"><strong>Email:</strong> {data.customer?.email || 'N/A'}</p>
                <p className="text-sm text-gray-700"><strong>Phone:</strong> {data.customer?.phone || 'N/A'}</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Shipping Address</h3>
                <p className="text-sm text-gray-700"><strong>Name:</strong> {data.shipping_address?.full_name || 'N/A'}</p>
                <p className="text-sm text-gray-700"><strong>Phone:</strong> {data.shipping_address?.phone || 'N/A'}</p>
                <p className="text-sm text-gray-700">
                  <strong>Address:</strong> {data.shipping_address?.address_line1 || ''} {data.shipping_address?.address_line2 || ''}
                </p>
                <p className="text-sm text-gray-700">
                  <strong>City:</strong> {data.shipping_address?.city || 'N/A'}, {data.shipping_address?.state || 'N/A'} {data.shipping_address?.postal_code || 'N/A'}
                </p>
                <p className="text-sm text-gray-700"><strong>Country:</strong> {data.shipping_address?.country || 'N/A'}</p>
              </div>
            </div>

            {/* Order Items */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-700">Item</th>
                      <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-700">Unit Price</th>
                      <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-700">Quantity</th>
                      <th className="border border-gray-200 px-4 py-3 text-left text-sm font-semibold text-gray-700">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items?.map((item, index) => (
                      <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                        <td className="border border-gray-200 px-4 py-3 text-sm text-gray-700">{item.item_title || 'Unknown Item'}</td>
                        <td className="border border-gray-200 px-4 py-3 text-sm text-gray-700">₹{item.unit_price ? item.unit_price.toFixed(2) : '0.00'}</td>
                        <td className="border border-gray-200 px-4 py-3 text-sm text-gray-700">{item.quantity || 0}</td>
                        <td className="border border-gray-200 px-4 py-3 text-sm text-gray-700 font-semibold">₹{item.line_total_price ? item.line_total_price.toFixed(2) : '0.00'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Total and Coupon */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xl font-semibold text-gray-900">Total Amount:</span>
                <span className="text-2xl font-bold text-gray-900">₹{data.total_price ? data.total_price.toFixed(2) : '0.00'}</span>
              </div>

              {data.coupon && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-green-800 mb-2">Discount Applied</h4>
                  <p className="text-sm text-green-700"><strong>Coupon Code:</strong> {data.coupon.code}</p>
                  <p className="text-sm text-green-700"><strong>Discount Type:</strong> {data.coupon.discount_type}</p>
                  <p className="text-sm text-green-700">
                    <strong>Discount Value:</strong> {data.coupon.discount_type === 'percentage' ? 
                      data.coupon.discount_value + '%' : 
                      '₹' + data.coupon.discount_value.toFixed(2)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Modal Footer */}
          <div className="border-t border-gray-200 p-6 bg-gray-50">
            <div className="flex justify-end space-x-3">
              <button
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors duration-200"
              >
                Close
              </button>
              <button
                onClick={handleDownloadFromModal}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200"
              >
                Download PDF
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ... rest of your component remains the same

  return (
    <div className="min-h-screen bg-gray-50 py-4">
      <div className="max-w-4xl mx-auto px-2 sm:px-2 lg:px-14">
        {/* Header */}
        <div className="mb-8 text-center sm:text-left">
          <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
          <p className="mt-2 text-gray-600">View your order history and track your purchases</p>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No orders yet</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              You have no orders placed yet. Start shopping to see your order history here.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 overflow-hidden"
              >
                {/* Order Header */}
                <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Order ID</p>
                        <p className="text-lg font-bold text-gray-900">#{order.id}</p>
                      </div>
                    </div>
                    <span
                      className={`px-4 py-2 rounded-full text-sm font-semibold capitalize ${
                        order.status === "Delivered"
                          ? "bg-green-100 text-green-800 border border-green-200"
                          : order.status === "Pending"
                          ? "bg-yellow-100 text-yellow-800 border border-yellow-200"
                          : "bg-blue-100 text-blue-800 border border-blue-200"
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                </div>

                {/* Order Items */}
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Items Ordered</h3>
                  <div className="space-y-4">
                    {order.items.length > 0 ? (
                      order.items.map((item, index) => {
                        const imageUrl = `http://127.0.0.1:8000${item.image_url}`;
                        return (
                          <div
                            key={item.id ?? item.item_id ?? index}
                            className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg border border-gray-100"
                          >
                            <img
                              src={imageUrl}
                              alt={item.item_title || "Product image"}
                              className="w-16 h-16 object-cover rounded-lg bg-white border border-gray-200"
                              onError={(e) => {
                                e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239CA3AF'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' /%3E%3C/svg%3E";
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <h4 className="text-base font-medium text-gray-900 truncate">
                                {item.item_title || "Unknown item"}
                              </h4>
                              <div className="flex items-center gap-4 mt-2">
                                <span className="text-sm text-gray-600">Qty: {item.quantity}</span>
                                <span className="text-sm font-semibold text-gray-900">
                                  ₹{item.line_total_price != null ? item.line_total_price.toFixed(2) : "N/A"}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
                        <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                        No items found
                      </div>
                    )}
                  </div>

                  {/* Order Total */}
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-gray-900">Total Amount:</span>
                      <span className="text-xl font-bold text-gray-900">
                        {order.total_price != null ? `₹${order.total_price.toFixed(2)}` : "N/A"}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons - Compact Layout */}
                  <div className="mt-6 space-y-3">
                    {/* Primary Action - Full Width */}
                    <button
                      className={`group relative w-full px-4 py-3 rounded-lg font-semibold text-base transition-all duration-200 transform hover:scale-[1.01] ${
                        reordering
                          ? "bg-gray-400 cursor-not-allowed text-gray-700 shadow-inner"
                          : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg active:scale-99"
                      }`}
                      onClick={() => handleOrderAgain(order)}
                      disabled={reordering}
                    >
                      {reordering ? (
                        <span className="inline-flex items-center justify-center gap-2">
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span className="font-medium">Adding Items to Cart...</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center gap-2">
                          <svg className="w-5 h-5 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Order All Items Again
                        </span>
                      )}
                    </button>

                    {/* Secondary Actions - Side by Side */}
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => handleViewInvoice(order)}
                        disabled={viewingInvoice === order.id}
                        className="group px-4 py-2.5 border-2 border-gray-300 rounded-lg text-gray-700 font-semibold hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700 transition-all duration-200 transform hover:scale-[1.01] active:scale-99 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {viewingInvoice === order.id ? (
                          <span className="inline-flex items-center justify-center gap-2 text-sm">
                            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            Loading...
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center gap-2 text-sm">
                            <svg className="w-4 h-4 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            View Invoice
                          </span>
                        )}
                      </button>

                      <button
                        onClick={() => handleDownloadInvoice(order)}
                        disabled={downloadingInvoice === order.id}
                        className="group px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-[1.01] active:scale-99 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {downloadingInvoice === order.id ? (
                          <span className="inline-flex items-center justify-center gap-2 text-sm">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Generating PDF...
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center gap-2 text-sm">
                            <svg className="w-4 h-4 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Download PDF
                          </span>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Invoice Modal */}
        <InvoiceModal 
          isOpen={invoiceModal.isOpen} 
          data={invoiceModal.data} 
          onClose={closeInvoiceModal} 
        />
      </div>
    </div>
  );
}