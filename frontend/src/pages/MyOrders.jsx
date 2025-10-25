// import React, { useEffect, useState } from "react";
// import { getMyOrders, getOrderInvoice } from "../api/orders";
// import { addOrUpdateCartItem } from "../api/cart";
// import { useNavigate } from "react-router-dom";
// import jsPDF from "jspdf";
// import autoTable from "jspdf-autotable";

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

//   const apiBaseUrl = process.env.REACT_APP_API_URL;

//   // Utils
//   const formatINR = (val) => {
//     const num = typeof val === "number" ? val : parseFloat(val || 0);
//     return new Intl.NumberFormat("en-IN", {
//       style: "currency",
//       currency: "INR",
//       maximumFractionDigits: 2,
//     }).format(isNaN(num) ? 0 : num);
//   };

//   const statusStyles = {
//     Delivered: { bg: "bg-green-100", text: "text-green-800", border: "border-green-200", dot: "bg-green-500" },
//     Pending: { bg: "bg-yellow-100", text: "text-yellow-800", border: "border-yellow-200", dot: "bg-yellow-400" },
//     default: { bg: "bg-blue-100", text: "text-blue-800", border: "border-blue-200", dot: "bg-blue-500" },
//   };

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
//       const response = await getOrderInvoice(order.id);
//       const invoiceData = response.data;

//       if (invoiceData) {
//         setInvoiceModal({ isOpen: true, data: invoiceData });
//       } else {
//         alert("Unable to load invoice data.");
//       }
//     } catch (err) {
//       alert("Failed to load invoice. Please try again.");
//     } finally {
//       setViewingInvoice(null);
//     }
//   };
//   const generatePDF = (invoiceData) => {
//     const doc = new jsPDF({ unit: "pt", format: "a4" });

//     // Colors
//     const primary = [37, 99, 235];
//     const dark = [30, 41, 59];
//     const gray = [100, 116, 139];
//     const light = [248, 250, 252];
//     const border = [226, 232, 240];
//     const success = [16, 185, 129];
//     const warning = [245, 158, 11];
//     const danger = [239, 68, 68];

//     // Page metrics
//     const pageWidth = doc.internal.pageSize.getWidth();
//     const pageHeight = doc.internal.pageSize.getHeight();
//     const margin = 48;
//     const contentWidth = pageWidth - margin * 2;

//     // Helpers
//     const ascii = (str) => String(str ?? "").replace(/[^\x20-\x7E]/g, ""); // strip non-ASCII
//     const formatMoney = (value) => {
//       const n = Number(value || 0);
//       const fixed = n.toFixed(2);
//       const [intPart, dec] = fixed.split(".");
//       const last3 = intPart.slice(-3);
//       const rest = intPart.slice(0, -3);
//       const withCommas = rest ? rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + last3 : last3;
//       return "Rs " + withCommas + "." + dec;
//     };

//     const statusColor =
//       invoiceData.status === "Delivered" ? success :
//         invoiceData.status === "Pending" ? warning : primary;

//     // HEADER
//     doc.setFillColor(...primary);
//     doc.rect(0, 0, pageWidth, 90, "F");

//     doc.setTextColor(255, 255, 255);
//     doc.setFont("helvetica", "bold");
//     doc.setFontSize(28);
//     doc.text("INVOICE", margin, 48);

//     doc.setFont("helvetica", "normal");
//     doc.setFontSize(11);
//     doc.text("Cart Stream", margin, 66);
//     doc.setFontSize(9);
//     doc.text("Professional E-commerce Solutions", margin, 80);

//     doc.setFont("helvetica", "bold");
//     doc.setFontSize(12);
//     doc.text(`INVOICE #${ascii(invoiceData.order_id)}`, pageWidth - margin, 44, { align: "right" });

//     doc.setFont("helvetica", "normal");
//     doc.setFontSize(10);
//     const formattedDate = invoiceData.order_date
//       ? new Date(invoiceData.order_date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
//       : "N/A";
//     doc.text(`Date: ${ascii(formattedDate)}`, pageWidth - margin, 60, { align: "right" });
//     doc.text("Due: Upon Receipt", pageWidth - margin, 74, { align: "right" });

//     // STATUS BADGE
//     doc.setFillColor(...statusColor);
//     doc.roundedRect(pageWidth - margin - 74, 98, 74, 22, 4, 4, "F");
//     doc.setTextColor(255, 255, 255);
//     doc.setFont("helvetica", "bold");
//     doc.setFontSize(9);
//     doc.text(ascii((invoiceData.status || "Processing").toUpperCase()), pageWidth - margin - 37, 113, { align: "center" });

//     // BILL TO / SHIP TO
//     const infoY = 140;
//     const colGap = 28;
//     const colWidth = (contentWidth - colGap) / 2;

//     doc.setTextColor(...dark);
//     doc.setFont("helvetica", "bold");
//     doc.setFontSize(12);
//     doc.text("BILLING ADDRESS", margin, infoY);
//     doc.text("SHIPPING ADDRESS", margin + colWidth + colGap, infoY);

//     doc.setFont("helvetica", "normal");
//     doc.setFontSize(10);
//     doc.setTextColor(...gray);

//     const customerLines = [
//       invoiceData.customer?.name,
//       invoiceData.customer?.email,
//       invoiceData.customer?.phone,
//     ].filter(Boolean).map(ascii);

//     const s = invoiceData.shipping_address || {};
//     const shippingLines = [
//       s.full_name,
//       s.phone,
//       [s.address_line1, s.address_line2].filter(Boolean).join(", "),
//       [s.city, s.state].filter(Boolean).join(", ") + (s.postal_code ? " " + s.postal_code : ""),
//       s.country,
//     ].filter(Boolean).map(ascii);

//     customerLines.forEach((line, i) => doc.text(line, margin, infoY + 16 + i * 13));
//     shippingLines.forEach((line, i) => doc.text(line, margin + colWidth + colGap, infoY + 16 + i * 13));

//     // ITEMS TABLE
//     const items = Array.isArray(invoiceData.items) ? invoiceData.items : [];
//     const tableStartY = infoY + 16 + Math.max(customerLines.length, shippingLines.length) * 13 + 24;

//     autoTable(doc, {
//       startY: tableStartY,
//       head: [["DESCRIPTION", "UNIT PRICE", "QTY", "TOTAL"]],
//       body: items.map((item) => {
//         const unit = Number(item.unit_price || 0);
//         const qty = Number(item.quantity || 0);
//         const total = item.line_total_price != null ? Number(item.line_total_price) : unit * qty;
//         return [
//           ascii(item.item_title || "Item"),
//           ascii(formatMoney(unit)),
//           ascii(String(qty)),
//           ascii(formatMoney(total)),
//         ];
//       }),
//       theme: "grid",
//       styles: {
//         font: "helvetica",
//         fontSize: 9,
//         textColor: dark,
//         cellPadding: 8,
//         overflow: "linebreak",
//         lineColor: border,
//         lineWidth: 0.6,
//       },
//       headStyles: { fillColor: dark, textColor: 255, fontStyle: "bold" },
//       alternateRowStyles: { fillColor: light },
//       margin: { left: margin, right: margin },
//       tableWidth: contentWidth,
//       columnStyles: {
//         0: { cellWidth: contentWidth - (100 + 56 + 110), halign: "left" },
//         1: { cellWidth: 100, halign: "right" },
//         2: { cellWidth: 56, halign: "center" },
//         3: { cellWidth: 110, halign: "right" },
//       },
//     });

//     const tableEndY = doc.lastAutoTable?.finalY || tableStartY;

//     // TOTALS BOX (right)
//     const summaryY = tableEndY + 22;
//     const boxW = 320;
//     const boxH = 126;
//     const boxX = pageWidth - margin - boxW;
//     const padding = 14;
//     const labelColW = 140;
//     const valueX = boxX + boxW - padding;
//     const labelX = valueX - labelColW;

//     // Compute numbers
//     const subtotal = items.reduce((acc, it) => {
//       const u = Number(it.unit_price || 0);
//       const q = Number(it.quantity || 0);
//       const line = it.line_total_price != null ? Number(it.line_total_price) : u * q;
//       return acc + (isNaN(line) ? 0 : line);
//     }, 0);

//     let discount = 0;
//     if (invoiceData.coupon) {
//       const c = invoiceData.coupon;
//       discount = c.discount_type === "percentage"
//         ? subtotal * (c.discount_value / 100)
//         : Math.min(subtotal, c.discount_value || 0);
//     }
//     const shippingCharge = Number(invoiceData.shipping_charge || 0);
//     const total =
//       invoiceData.total_price != null ? Number(invoiceData.total_price) : subtotal - discount + shippingCharge;

//     // Totals box
//     doc.setDrawColor(...border);
//     doc.roundedRect(boxX, summaryY, boxW, boxH, 6, 6, "D");

//     doc.setFont("helvetica", "normal");
//     doc.setFontSize(10);

//     let y = summaryY + 22;

//     // Subtotal
//     doc.setTextColor(...gray);
//     doc.text("Subtotal", labelX, y, { align: "right" });
//     doc.setTextColor(...dark);
//     doc.text(ascii(formatMoney(subtotal)), valueX, y, { align: "right" });

//     // Discount
//     y += 18;
//     doc.setTextColor(...gray);
//     doc.text("Discount", labelX, y, { align: "right" });
//     doc.setTextColor(...danger);
//     doc.text(ascii("-" + formatMoney(discount)), valueX, y, { align: "right" });

//     // Small caption below Discount with coupon code and value (ONLY this, no separate card)
//     if (invoiceData.coupon) {
//       const c = invoiceData.coupon;
//       const couponValue =
//         c.discount_type === "percentage" ? `${c.discount_value}%` : formatMoney(c.discount_value);
//       doc.setFontSize(8);
//       doc.setTextColor(...success);
//       doc.text(`Coupon: ${ascii(c.code)} (${ascii(couponValue)})`, valueX, y + 14, { align: "right" });
//       doc.setFontSize(10);
//     }

//     // Shipping
//     y += 28;
//     doc.setTextColor(...gray);
//     doc.text("Shipping", labelX, y, { align: "right" });
//     doc.setTextColor(...dark);
//     doc.text(ascii(formatMoney(shippingCharge)), valueX, y, { align: "right" });

//     // Divider
//     y += 8;
//     doc.setDrawColor(...border);
//     doc.line(boxX + padding, y + 8, boxX + boxW - padding, y + 8);

//     // Total
//     y += 26;
//     doc.setFont("helvetica", "bold");
//     doc.setFontSize(12);
//     doc.setTextColor(...dark);
//     doc.text("Total", labelX, y, { align: "right" });
//     doc.text(ascii(formatMoney(total)), valueX, y, { align: "right" });

//     // FOOTER (same layout you already use, using ASCII-safe strings)
//     const getFooterMessage = (status) => {
//       const st = (status || "").toLowerCase();
//       if (st === "delivered") return "Hope you love your purchase. Need help? support@yourstore.com";
//       if (st === "pending" || st === "processing") return "We are getting your order ready. You will receive tracking details by email.";
//       return "Thanks for shopping with us! We are here if you need anything.";
//     };

//     const addFooter = () => {
//       const pageCount = doc.getNumberOfPages();
//       const baseSize = 8;
//       const gap = 14;

//       for (let i = 1; i <= pageCount; i++) {
//         doc.setPage(i);

//         const lineY = pageHeight - 56;
//         doc.setDrawColor(...border);
//         doc.line(margin, lineY, pageWidth - margin, lineY);

//         doc.setFont("helvetica", "normal");
//         doc.setFontSize(baseSize);
//         doc.setTextColor(...gray);

//         const baselineY = lineY + 18;
//         const leftX = margin;
//         const rightX = pageWidth - margin;
//         const contentW = pageWidth - margin * 2;

//         const contact = ascii("support@yourstore.com  |  +91 98765 43210  |  yourstore.com");
//         const pageStr = `Page ${i} of ${pageCount}`;
//         const msg = ascii(getFooterMessage(invoiceData?.status));

//         const fitText = (text, maxWidth) => {
//           if (doc.getTextWidth(text) <= maxWidth) return text;
//           let t = text;
//           while (t.length > 4 && doc.getTextWidth(t + "...") > maxWidth) t = t.slice(0, -1);
//           return t.length ? t + "..." : "";
//         };
//         const drawCenterFitted = (text, cx, y, maxWidth) => {
//           doc.setFontSize(baseSize);
//           if (doc.getTextWidth(text) <= maxWidth) {
//             doc.text(text, cx, y, { align: "center" });
//             return;
//           }
//           const targetSize = Math.max(7, Math.floor(baseSize * (maxWidth / doc.getTextWidth(text))));
//           doc.setFontSize(targetSize);
//           if (doc.getTextWidth(text) <= maxWidth) {
//             doc.text(text, cx, y, { align: "center" });
//           } else {
//             const truncated = fitText(text, maxWidth);
//             doc.text(truncated, cx, y, { align: "center" });
//           }
//           doc.setFontSize(baseSize);
//         };

//         const leftMax = contentW * 0.48;
//         const rightMax = Math.max(80, Math.min(doc.getTextWidth(pageStr) + 2, contentW * 0.22));

//         const leftText = fitText(contact, leftMax);
//         const leftW = Math.min(doc.getTextWidth(leftText), leftMax);

//         const rightText = fitText(pageStr, rightMax);
//         const rightW = Math.min(doc.getTextWidth(rightText), rightMax);

//         const midStart = leftX + leftW + gap;
//         const midEnd = rightX - rightW - gap;
//         const midAvail = Math.max(0, midEnd - midStart);
//         const midCenterX = midStart + midAvail / 2;

//         doc.text(leftText, leftX, baselineY, { align: "left" });
//         drawCenterFitted(msg, midCenterX, baselineY, midAvail);
//         doc.text(rightText, rightX, baselineY, { align: "right" });
//       }
//     };
//     addFooter();

//     return doc;
//   };

//   const handleDownloadInvoice = async (order) => {
//     setDownloadingInvoice(order.id);
//     try {
//       const response = await getOrderInvoice(order.id);
//       const invoiceData = response.data;
//       if (invoiceData) {
//         await new Promise((resolve) => setTimeout(resolve, 400));
//         const pdfDoc = generatePDF(invoiceData);
//         pdfDoc.save(`invoice-${order.id}.pdf`);
//       } else {
//         alert("Unable to generate invoice.");
//       }
//     } catch (err) {
//       console.error("PDF generation error:", err);
//       alert("Failed to download invoice. Please try again.");
//     } finally {
//       setDownloadingInvoice(null);
//     }
//   };

//   const closeInvoiceModal = () => {
//     setInvoiceModal({ isOpen: false, data: null });
//   };

//   // Skeletons & Alerts
//   const ErrorAlert = ({ message }) => (
//     <div className="mb-6 rounded-xl border border-red-200 bg-red-50 text-red-800 p-4 flex items-start gap-3">
//       <svg className="w-5 h-5 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M4.93 4.93l14.14 14.14" />
//       </svg>
//       <div className="text-sm">{message}</div>
//     </div>
//   );

//   const SkeletonOrderCard = () => (
//     <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-pulse">
//       <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
//         <div className="h-5 w-32 bg-gray-200 rounded" />
//       </div>
//       <div className="p-6 space-y-4">
//         {[1, 2].map((k) => (
//           <div key={k} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
//             <div className="w-16 h-16 bg-gray-200 rounded-lg" />
//             <div className="flex-1 space-y-2">
//               <div className="h-4 w-1/3 bg-gray-200 rounded" />
//               <div className="h-4 w-1/4 bg-gray-200 rounded" />
//             </div>
//           </div>
//         ))}
//         <div className="mt-6 pt-6 border-t border-gray-200 flex justify-between">
//           <div className="h-5 w-24 bg-gray-200 rounded" />
//           <div className="h-6 w-28 bg-gray-200 rounded" />
//         </div>
//         <div className="grid grid-cols-2 gap-3 mt-4">
//           <div className="h-10 bg-gray-200 rounded-lg" />
//           <div className="h-10 bg-gray-200 rounded-lg" />
//         </div>
//       </div>
//     </div>
//   );

//   // Invoice Modal (UI polish only)
//   const InvoiceModal = ({ isOpen, data, onClose }) => {
//     if (!isOpen || !data) return null;

//     const handleDownloadFromModal = () => {
//       const pdfDoc = generatePDF(data);
//       pdfDoc.save(`invoice-${data.order_id}.pdf`);
//     };

//     const statusConfig =
//       data.status === "Delivered"
//         ? { chip: "bg-green-100 text-green-800", text: "Delivered" }
//         : data.status === "Pending"
//           ? { chip: "bg-yellow-100 text-yellow-800", text: "Pending" }
//           : { chip: "bg-blue-100 text-blue-800", text: data.status || "Processing" };

//     return (
//       <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
//         <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[92vh] overflow-hidden shadow-2xl ring-1 ring-black/5">
//           {/* Header */}
//           <div className="flex justify-between items-center p-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
//             <div>
//               <h2 className="text-2xl font-bold text-gray-900">Invoice #{data.order_id}</h2>
//               <p className="text-sm text-gray-600">
//                 Order Date: {data.order_date ? new Date(data.order_date).toLocaleDateString() : "N/A"}
//               </p>
//             </div>
//             <div className={`px-3 py-1 rounded-full text-sm font-medium ${statusConfig.chip}`}>{statusConfig.text}</div>
//           </div>

//           {/* Content */}
//           <div className="flex-1 overflow-y-auto p-6 space-y-6">
//             {/* Customer + Shipping */}
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//               <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
//                 <h3 className="text-lg font-semibold text-gray-900 mb-3">Customer</h3>
//                 <dl className="grid grid-cols-3 gap-y-2 text-sm">
//                   <dt className="text-gray-600">Name</dt>
//                   <dd className="col-span-2 text-gray-900">{data.customer?.name || "N/A"}</dd>
//                   <dt className="text-gray-600">Email</dt>
//                   <dd className="col-span-2 text-gray-900">{data.customer?.email || "N/A"}</dd>
//                   <dt className="text-gray-600">Phone</dt>
//                   <dd className="col-span-2 text-gray-900">{data.customer?.phone || "N/A"}</dd>
//                 </dl>
//               </div>

//               <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
//                 <h3 className="text-lg font-semibold text-gray-900 mb-3">Shipping</h3>
//                 <dl className="grid grid-cols-3 gap-y-2 text-sm">
//                   <dt className="text-gray-600">Name</dt>
//                   <dd className="col-span-2 text-gray-900">{data.shipping_address?.full_name || "N/A"}</dd>
//                   <dt className="text-gray-600">Phone</dt>
//                   <dd className="col-span-2 text-gray-900">{data.shipping_address?.phone || "N/A"}</dd>
//                   <dt className="text-gray-600">Address</dt>
//                   <dd className="col-span-2 text-gray-900">
//                     {(data.shipping_address?.address_line1 || "") +
//                       (data.shipping_address?.address_line2 ? `, ${data.shipping_address?.address_line2}` : "")}
//                   </dd>
//                   <dt className="text-gray-600">City</dt>
//                   <dd className="col-span-2 text-gray-900">
//                     {(data.shipping_address?.city || "N/A") +
//                       (data.shipping_address?.state ? `, ${data.shipping_address?.state}` : "")}{" "}
//                     {data.shipping_address?.postal_code || ""}
//                   </dd>
//                   <dt className="text-gray-600">Country</dt>
//                   <dd className="col-span-2 text-gray-900">{data.shipping_address?.country || "N/A"}</dd>
//                 </dl>
//               </div>
//             </div>

//             {/* Items */}
//             <div>
//               <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h3>
//               <div className="overflow-x-auto rounded-xl border border-gray-200">
//                 <table className="w-full border-collapse">
//                   <thead className="bg-gray-50">
//                     <tr>
//                       <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">Item</th>
//                       <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 border-b">Unit Price</th>
//                       <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 border-b">Quantity</th>
//                       <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 border-b">Total</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {data.items?.map((item, index) => {
//                       const unit = item.unit_price != null ? parseFloat(item.unit_price) : 0;
//                       const qty = item.quantity || 0;
//                       const line = item.line_total_price != null ? parseFloat(item.line_total_price) : unit * qty;
//                       return (
//                         <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
//                           <td className="px-4 py-3 text-sm text-gray-800 border-b">{item.item_title || "Unknown Item"}</td>
//                           <td className="px-4 py-3 text-sm text-gray-800 border-b text-right">{formatINR(unit)}</td>
//                           <td className="px-4 py-3 text-sm text-gray-800 border-b text-center">{qty}</td>
//                           <td className="px-4 py-3 text-sm text-gray-900 font-semibold border-b text-right">{formatINR(line)}</td>
//                         </tr>
//                       );
//                     })}
//                   </tbody>
//                 </table>
//               </div>
//             </div>

//             {/* Totals */}
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//               <div className="rounded-xl border border-gray-200 p-4 bg-gradient-to-br from-white to-gray-50">
//                 {data.coupon && (
//                   <div className="bg-green-50 border border-green-200 rounded-lg p-4">
//                     <h4 className="text-lg font-semibold text-green-800 mb-2">Discount Applied</h4>
//                     <p className="text-sm text-green-700">
//                       <strong>Coupon:</strong> {data.coupon.code} •{" "}
//                       {data.coupon.discount_type === "percentage"
//                         ? `${data.coupon.discount_value}%`
//                         : formatINR(data.coupon.discount_value)}
//                     </p>
//                   </div>
//                 )}
//               </div>
//               <div className="rounded-xl border border-gray-200 p-4 bg-white">
//                 <div className="flex justify-between mb-2 text-gray-700">
//                   <span>Subtotal</span>
//                   <span className="font-medium">
//                     {data.subtotal != null ? formatINR(data.subtotal) : formatINR(0)}
//                   </span>
//                 </div>
//                 <div className="flex justify-between mb-2 text-gray-700">
//                   <span>Discount</span>
//                   <span className="font-medium text-red-600">
//                     - {data.discount_amount != null ? formatINR(data.discount_amount) : formatINR(0)}
//                   </span>
//                 </div>
//                 <div className="flex justify-between pb-3 mb-3 border-b text-gray-700">
//                   <span>Shipping</span>
//                   <span className="font-medium">
//                     {data.shipping_charge != null ? formatINR(data.shipping_charge) : formatINR(0)}
//                   </span>
//                 </div>
//                 <div className="flex justify-between items-center">
//                   <span className="text-lg font-semibold text-gray-900">Total</span>
//                   <span className="text-2xl font-bold text-gray-900">
//                     {data.total_price != null ? formatINR(data.total_price) : formatINR(0)}
//                   </span>
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Footer */}
//           <div className="border-t border-gray-200 p-5 bg-gray-50 flex items-center justify-end gap-3">
//             <button
//               onClick={onClose}
//               className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
//             >
//               Close
//             </button>
//             <button
//               onClick={handleDownloadFromModal}
//               className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
//             >
//               Download PDF
//             </button>
//           </div>
//         </div>
//       </div>
//     );
//   };

//   return (
//     <div className="min-h-screen bg-gray-50 py-6">
//       <div className="max-w-5xl mx-auto px-3 sm:px-4 lg:px-6">
//         {/* Page Header */}
//         <div className="mb-8">
//           <div className="flex items-center justify-between flex-wrap gap-3">
//             <div>
//               <h1 className="text-3xl font-bold tracking-tight text-gray-900">My Orders</h1>
//               <p className="mt-1 text-gray-600">Review your order history and invoices</p>
//             </div>
//           </div>
//         </div>

//         {/* Error */}
//         {error && <ErrorAlert message={error} />}

//         {/* Loading */}
//         {loading && (
//           <div className="space-y-6">
//             <SkeletonOrderCard />
//             <SkeletonOrderCard />
//           </div>
//         )}

//         {/* Content */}
//         {!loading && orders.length === 0 ? (
//           <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
//             <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
//               <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
//             {orders.map((order) => {
//               const styles = statusStyles[order.status] || statusStyles.default;
//               return (
//                 <div
//                   key={order.id}
//                   className="bg-white rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 overflow-hidden"
//                 >
//                   {/* Order Header */}
//                   <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
//                     <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
//                       <div className="flex items-center gap-4">
//                         <div className="flex items-center gap-2">
//                           <span className={`inline-block w-2.5 h-2.5 rounded-full ${styles.dot}`} aria-hidden="true" />
//                           <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize border ${styles.bg} ${styles.text} ${styles.border}`}>
//                             {order.status || "Processing"}
//                           </span>
//                         </div>
//                         <div className="hidden sm:block h-6 w-px bg-gray-200" />
//                         <div>
//                           <p className="text-sm font-medium text-gray-500">Order ID</p>
//                           <p className="text-lg font-bold text-gray-900">#{order.id}</p>
//                         </div>
//                       </div>

//                       <div className="text-sm text-gray-600">
//                         <span className="font-medium text-gray-800">Placed:</span>{" "}
//                         {order.order_date ? new Date(order.order_date).toLocaleDateString() : "N/A"}
//                       </div>
//                     </div>
//                   </div>

//                   {/* Order Items */}
//                   <div className="p-6">
//                     <h3 className="text-lg font-semibold text-gray-900 mb-4">Items</h3>

//                     <div className="space-y-4">
//                       {order.items?.length > 0 ? (
//                         order.items.map((item, index) => {
//                           const imgSrc =
//                             item.image_url?.startsWith("http") || item.image_url?.startsWith("data:")
//                               ? item.image_url
//                               : `${apiBaseUrl}${item.image_url || ""}`;

//                           const qty = item.quantity || 0;
//                           const unit = item.unit_price != null ? parseFloat(item.unit_price) : 0;
//                           const line = item.line_total_price != null ? parseFloat(item.line_total_price) : unit * qty;

//                           return (
//                             <div
//                               key={item.id ?? item.item_id ?? index}
//                               className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition"
//                             >
//                               <img
//                                 src={imgSrc}
//                                 alt={item.item_title || "Product image"}
//                                 className="w-16 h-16 object-cover rounded-lg bg-white border border-gray-200 flex-shrink-0"
//                                 onError={(e) => {
//                                   e.currentTarget.src =
//                                     "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239CA3AF'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' /%3E%3C/svg%3E";
//                                 }}
//                               />
//                               <div className="flex-1 min-w-0">
//                                 <h4 className="text-base font-medium text-gray-900 truncate">
//                                   {item.item_title || "Unknown item"}
//                                 </h4>
//                                 <div className="flex items-center gap-4 mt-2 text-sm">
//                                   <span className="text-gray-600">Qty: {qty}</span>
//                                   <span className="text-gray-500">•</span>
//                                   <span className="text-gray-600">Unit: {formatINR(unit)}</span>
//                                   <span className="text-gray-500">•</span>
//                                   <span className="font-semibold text-gray-900">Line: {formatINR(line)}</span>
//                                 </div>
//                               </div>
//                             </div>
//                           );
//                         })
//                       ) : (
//                         <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-xl border border-gray-200">
//                           <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
//                           </svg>
//                           No items found
//                         </div>
//                       )}
//                     </div>

//                     {/* Order Total */}
//                     <div className="mt-6 pt-6 border-t border-gray-200">
//                       <div className="flex justify-between items-center">
//                         <span className="text-lg font-semibold text-gray-900">Total Amount</span>
//                         <span className="text-2xl font-bold text-gray-900">
//                           {order.total_price != null ? formatINR(order.total_price) : "N/A"}
//                         </span>
//                       </div>
//                     </div>

//                     {/* Actions */}
//                     <div className="mt-6 space-y-3">
//                       <button
//                         className={`group relative w-full px-4 py-3 rounded-lg font-semibold text-base transition-all duration-200 transform focus:outline-none focus:ring-2 focus:ring-blue-500 ${reordering
//                           ? "bg-gray-400 cursor-not-allowed text-gray-700 shadow-inner"
//                           : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg active:scale-99"
//                           }`}
//                         onClick={() => handleOrderAgain(order)}
//                         disabled={reordering}
//                         aria-label="Order all items again"
//                       >
//                         {reordering ? (
//                           <span className="inline-flex items-center justify-center gap-2">
//                             <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
//                             <span className="font-medium">Adding Items to Cart...</span>
//                           </span>
//                         ) : (
//                           <span className="inline-flex items-center justify-center gap-2">
//                             <svg className="w-5 h-5 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
//                             </svg>
//                             Order All Items Again
//                           </span>
//                         )}
//                       </button>

//                       <div className="grid grid-cols-2 gap-3">
//                         <button
//                           onClick={() => handleViewInvoice(order)}
//                           disabled={viewingInvoice === order.id}
//                           className="group px-4 py-2.5 border-2 border-gray-300 rounded-lg text-gray-700 font-semibold hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700 transition-all duration-200 transform hover:scale-[1.01] active:scale-99 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
//                           aria-label="View invoice"
//                         >
//                           {viewingInvoice === order.id ? (
//                             <span className="inline-flex items-center justify-center gap-2 text-sm">
//                               <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
//                               Loading...
//                             </span>
//                           ) : (
//                             <span className="inline-flex items-center justify-center gap-2 text-sm">
//                               <svg className="w-4 h-4 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
//                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
//                               </svg>
//                               View Invoice
//                             </span>
//                           )}
//                         </button>

//                         <button
//                           onClick={() => handleDownloadInvoice(order)}
//                           disabled={downloadingInvoice === order.id}
//                           className="group px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-[1.01] active:scale-99 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-emerald-500"
//                           aria-label="Download invoice as PDF"
//                         >
//                           {downloadingInvoice === order.id ? (
//                             <span className="inline-flex items-center justify-center gap-2 text-sm">
//                               <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
//                               Generating PDF...
//                             </span>
//                           ) : (
//                             <span className="inline-flex items-center justify-center gap-2 text-sm">
//                               <svg className="w-4 h-4 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
//                               </svg>
//                               Download PDF
//                             </span>
//                           )}
//                         </button>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
//         )}

//         {/* Invoice Modal */}
//         <InvoiceModal isOpen={invoiceModal.isOpen} data={invoiceModal.data} onClose={closeInvoiceModal} />
//       </div>
//     </div>
//   );
// }

import React, { useEffect, useState } from "react";
import { getMyOrders, getOrderInvoice } from "../api/orders";
import { addOrUpdateCartItem } from "../api/cart";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { ui } from "../theme/ui";

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

  const apiBaseUrl = process.env.REACT_APP_API_URL;

  // Utils
  const formatINR = (val) => {
    const num = typeof val === "number" ? val : parseFloat(val || 0);
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(isNaN(num) ? 0 : num);
  };

  const statusConfig = (status) => {
    const s = (status || "").toLowerCase();
    if (s === "delivered") {
      return { chip: "bg-emerald-100 text-emerald-800 border-emerald-200", dot: "bg-emerald-500" };
    }
    if (s === "pending" || s === "processing") {
      return { chip: "bg-yellow-100 text-yellow-800 border-yellow-200", dot: "bg-yellow-400" };
    }
    return { chip: "bg-blue-100 text-blue-800 border-blue-200", dot: "bg-blue-500" };
  };

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
        const data = { item_id: item.item_id, quantity: item.quantity };
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
        alert("Unable to load invoice data.");
      }
    } catch (err) {
      alert("Failed to load invoice. Please try again.");
    } finally {
      setViewingInvoice(null);
    }
  };

  // PDF GENERATION (unchanged)
  const generatePDF = (invoiceData) => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });

    // Colors
    const primary = [37, 99, 235];
    const dark = [30, 41, 59];
    const gray = [100, 116, 139];
    const light = [248, 250, 252];
    const border = [226, 232, 240];
    const success = [16, 185, 129];
    const warning = [245, 158, 11];
    const danger = [239, 68, 68];

    // Page metrics
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 48;
    const contentWidth = pageWidth - margin * 2;

    // Helpers
    const ascii = (str) => String(str ?? "").replace(/[^\x20-\x7E]/g, "");
    const formatMoney = (value) => {
      const n = Number(value || 0);
      const fixed = n.toFixed(2);
      const [intPart, dec] = fixed.split(".");
      const last3 = intPart.slice(-3);
      const rest = intPart.slice(0, -3);
      const withCommas = rest ? rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + last3 : last3;
      return "Rs " + withCommas + "." + dec;
    };

    const statusColor = invoiceData.status === "Delivered" ? success : invoiceData.status === "Pending" ? warning : primary;

    // Header
    doc.setFillColor(...primary);
    doc.rect(0, 0, pageWidth, 90, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(28);
    doc.text("INVOICE", margin, 48);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text("Cart Stream", margin, 66);
    doc.setFontSize(9);
    doc.text("Professional E-commerce Solutions", margin, 80);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(`INVOICE #${ascii(invoiceData.order_id)}`, pageWidth - margin, 44, { align: "right" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const formattedDate = invoiceData.order_date
      ? new Date(invoiceData.order_date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
      : "N/A";
    doc.text(`Date: ${ascii(formattedDate)}`, pageWidth - margin, 60, { align: "right" });
    doc.text("Due: Upon Receipt", pageWidth - margin, 74, { align: "right" });

    // Status badge
    doc.setFillColor(...statusColor);
    doc.roundedRect(pageWidth - margin - 74, 98, 74, 22, 4, 4, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(ascii((invoiceData.status || "Processing").toUpperCase()), pageWidth - margin - 37, 113, { align: "center" });

    // Billing/Shipping
    const infoY = 140;
    const colGap = 28;
    const colWidth = (contentWidth - colGap) / 2;

    doc.setTextColor(...dark);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("BILLING ADDRESS", margin, infoY);
    doc.text("SHIPPING ADDRESS", margin + colWidth + colGap, infoY);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...gray);

    const customerLines = [invoiceData.customer?.name, invoiceData.customer?.email, invoiceData.customer?.phone]
      .filter(Boolean)
      .map(ascii);

    const s = invoiceData.shipping_address || {};
    const shippingLines = [
      s.full_name,
      s.phone,
      [s.address_line1, s.address_line2].filter(Boolean).join(", "),
      [s.city, s.state].filter(Boolean).join(", ") + (s.postal_code ? " " + s.postal_code : ""),
      s.country,
    ]
      .filter(Boolean)
      .map(ascii);

    customerLines.forEach((line, i) => doc.text(line, margin, infoY + 16 + i * 13));
    shippingLines.forEach((line, i) => doc.text(line, margin + colWidth + colGap, infoY + 16 + i * 13));

    // Items table
    const items = Array.isArray(invoiceData.items) ? invoiceData.items : [];
    const tableStartY = infoY + 16 + Math.max(customerLines.length, shippingLines.length) * 13 + 24;

    autoTable(doc, {
      startY: tableStartY,
      head: [["DESCRIPTION", "UNIT PRICE", "QTY", "TOTAL"]],
      body: items.map((item) => {
        const unit = Number(item.unit_price || 0);
        const qty = Number(item.quantity || 0);
        const total = item.line_total_price != null ? Number(item.line_total_price) : unit * qty;
        return [ascii(item.item_title || "Item"), ascii(formatMoney(unit)), ascii(String(qty)), ascii(formatMoney(total))];
      }),
      theme: "grid",
      styles: {
        font: "helvetica",
        fontSize: 9,
        textColor: dark,
        cellPadding: 8,
        overflow: "linebreak",
        lineColor: border,
        lineWidth: 0.6,
      },
      headStyles: { fillColor: dark, textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: light },
      margin: { left: margin, right: margin },
      tableWidth: contentWidth,
      columnStyles: {
        0: { cellWidth: contentWidth - (100 + 56 + 110), halign: "left" },
        1: { cellWidth: 100, halign: "right" },
        2: { cellWidth: 56, halign: "center" },
        3: { cellWidth: 110, halign: "right" },
      },
    });

    const tableEndY = doc.lastAutoTable?.finalY || tableStartY;

    // Totals box
    const summaryY = tableEndY + 22;
    const boxW = 320;
    const boxH = 126;
    const boxX = pageWidth - margin - boxW;
    const padding = 14;
    const labelColW = 140;
    const valueX = boxX + boxW - padding;
    const labelX = valueX - labelColW;

    const subtotal = items.reduce((acc, it) => {
      const u = Number(it.unit_price || 0);
      const q = Number(it.quantity || 0);
      const line = it.line_total_price != null ? Number(it.line_total_price) : u * q;
      return acc + (isNaN(line) ? 0 : line);
    }, 0);

    let discount = 0;
    if (invoiceData.coupon) {
      const c = invoiceData.coupon;
      discount = c.discount_type === "percentage" ? subtotal * (c.discount_value / 100) : Math.min(subtotal, c.discount_value || 0);
    }
    const shippingCharge = Number(invoiceData.shipping_charge || 0);
    const total =
      invoiceData.total_price != null ? Number(invoiceData.total_price) : subtotal - discount + shippingCharge;

    doc.setDrawColor(...border);
    doc.roundedRect(boxX, summaryY, boxW, boxH, 6, 6, "D");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    let y = summaryY + 22;

    doc.setTextColor(...gray);
    doc.text("Subtotal", labelX, y, { align: "right" });
    doc.setTextColor(...dark);
    doc.text(ascii(formatMoney(subtotal)), valueX, y, { align: "right" });

    y += 18;
    doc.setTextColor(...gray);
    doc.text("Discount", labelX, y, { align: "right" });
    doc.setTextColor(...danger);
    doc.text(ascii("-" + formatMoney(discount)), valueX, y, { align: "right" });

    if (invoiceData.coupon) {
      const c = invoiceData.coupon;
      const couponValue = c.discount_type === "percentage" ? `${c.discount_value}%` : formatMoney(c.discount_value);
      doc.setFontSize(8);
      doc.setTextColor(...success);
      doc.text(`Coupon: ${ascii(c.code)} (${ascii(couponValue)})`, valueX, y + 14, { align: "right" });
      doc.setFontSize(10);
    }

    y += 28;
    doc.setTextColor(...gray);
    doc.text("Shipping", labelX, y, { align: "right" });
    doc.setTextColor(...dark);
    doc.text(ascii(formatMoney(shippingCharge)), valueX, y, { align: "right" });

    y += 8;
    doc.setDrawColor(...border);
    doc.line(boxX + padding, y + 8, boxX + boxW - padding, y + 8);

    y += 26;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...dark);
    doc.text("Total", labelX, y, { align: "right" });
    doc.text(ascii(formatMoney(total)), valueX, y, { align: "right" });

    // Footer
    const getFooterMessage = (status) => {
      const st = (status || "").toLowerCase();
      if (st === "delivered") return "Hope you love your purchase. Need help? support@yourstore.com";
      if (st === "pending" || st === "processing") return "We are getting your order ready. You will receive tracking details by email.";
      return "Thanks for shopping with us! We are here if you need anything.";
    };

    const addFooter = () => {
      const pageCount = doc.getNumberOfPages();
      const baseSize = 8;
      const gap = 14;
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        const lineY = pageHeight - 56;
        doc.setDrawColor(...border);
        doc.line(48, lineY, pageWidth - 48, lineY);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(baseSize);
        doc.setTextColor(...gray);

        const baselineY = lineY + 18;
        const leftX = 48;
        const rightX = pageWidth - 48;
        const contentW = pageWidth - 96;

        const contact = ascii("support@yourstore.com  |  +91 98765 43210  |  yourstore.com");
        const pageStr = `Page ${i} of ${pageCount}`;
        const msg = ascii(getFooterMessage(invoiceData?.status));

        const fitText = (text, maxWidth) => {
          if (doc.getTextWidth(text) <= maxWidth) return text;
          let t = text;
          while (t.length > 4 && doc.getTextWidth(t + "...") > maxWidth) t = t.slice(0, -1);
          return t.length ? t + "..." : "";
        };
        const drawCenterFitted = (text, cx, y, maxWidth) => {
          doc.setFontSize(baseSize);
          if (doc.getTextWidth(text) <= maxWidth) {
            doc.text(text, cx, y, { align: "center" });
            return;
          }
          const targetSize = Math.max(7, Math.floor(baseSize * (maxWidth / doc.getTextWidth(text))));
          doc.setFontSize(targetSize);
          if (doc.getTextWidth(text) <= maxWidth) {
            doc.text(text, cx, y, { align: "center" });
          } else {
            const truncated = fitText(text, maxWidth);
            doc.text(truncated, cx, y, { align: "center" });
          }
          doc.setFontSize(baseSize);
        };

        const leftMax = contentW * 0.48;
        const rightMax = Math.max(80, Math.min(doc.getTextWidth(pageStr) + 2, contentW * 0.22));

        const leftText = fitText(contact, leftMax);
        const leftW = Math.min(doc.getTextWidth(leftText), leftMax);

        const rightText = fitText(pageStr, rightMax);
        const rightW = Math.min(doc.getTextWidth(rightText), rightMax);

        const midStart = leftX + leftW + gap;
        const midEnd = rightX - rightW - gap;
        const midAvail = Math.max(0, midEnd - midStart);
        const midCenterX = midStart + midAvail / 2;

        doc.text(leftText, leftX, baselineY, { align: "left" });
        drawCenterFitted(msg, midCenterX, baselineY, midAvail);
        doc.text(rightText, rightX, baselineY, { align: "right" });
      }
    };
    addFooter();

    return doc;
  };

  const handleDownloadInvoice = async (order) => {
    setDownloadingInvoice(order.id);
    try {
      const response = await getOrderInvoice(order.id);
      const invoiceData = response.data;
      if (invoiceData) {
        await new Promise((resolve) => setTimeout(resolve, 400));
        const pdfDoc = generatePDF(invoiceData);
        pdfDoc.save(`invoice-${order.id}.pdf`);
      } else {
        alert("Unable to generate invoice.");
      }
    } catch (err) {
      console.error("PDF generation error:", err);
      alert("Failed to download invoice. Please try again.");
    } finally {
      setDownloadingInvoice(null);
    }
  };

  const closeInvoiceModal = () => setInvoiceModal({ isOpen: false, data: null });

  // UI helpers
  const ErrorAlert = ({ message }) => (
    <div className="mb-6 rounded-xl border border-red-200 bg-red-50 text-red-800 p-4 flex items-start gap-3">
      <svg className="w-5 h-5 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M4.93 4.93l14.14 14.14" />
      </svg>
      <div className="text-sm">{message}</div>
    </div>
  );

  const SkeletonOrderCard = () => (
    <div className={`${ui.card} overflow-hidden animate-pulse`}>
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
        <div className="h-5 w-32 bg-gray-200 rounded" />
      </div>
      <div className="p-6 space-y-4">
        {[1, 2].map((k) => (
          <div key={k} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
            <div className="w-16 h-16 bg-gray-200 rounded-lg" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/3 bg-gray-200 rounded" />
              <div className="h-4 w-1/4 bg-gray-200 rounded" />
            </div>
          </div>
        ))}
        <div className="mt-6 pt-6 border-t border-gray-200 flex justify-between">
          <div className="h-5 w-24 bg-gray-200 rounded" />
          <div className="h-6 w-28 bg-gray-200 rounded" />
        </div>
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="h-10 bg-gray-200 rounded-lg" />
          <div className="h-10 bg-gray-200 rounded-lg" />
        </div>
      </div>
    </div>
  );

  const InvoiceModal = ({ isOpen, data, onClose }) => {
    if (!isOpen || !data) return null;

    const handleDownloadFromModal = () => {
      const pdfDoc = generatePDF(data);
      pdfDoc.save(`invoice-${data.order_id}.pdf`);
    };

    const sc = statusConfig(data.status);

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className={`${ui.card} max-w-5xl w-full max-h-[92vh] overflow-hidden`}>
          {/* Header */}
          <div className="flex justify-between items-center p-5 border-b border-gray-200 bg-gray-50">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Invoice #{data.order_id}</h2>
              <p className="text-sm text-gray-600">Order Date: {data.order_date ? new Date(data.order_date).toLocaleDateString() : "N/A"}</p>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-semibold border ${sc.chip}`}>{data.status || "Processing"}</div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Customer + Shipping */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Customer</h3>
                <dl className="grid grid-cols-3 gap-y-2 text-sm">
                  <dt className="text-gray-600">Name</dt>
                  <dd className="col-span-2 text-gray-900">{data.customer?.name || "N/A"}</dd>
                  <dt className="text-gray-600">Email</dt>
                  <dd className="col-span-2 text-gray-900">{data.customer?.email || "N/A"}</dd>
                  <dt className="text-gray-600">Phone</dt>
                  <dd className="col-span-2 text-gray-900">{data.customer?.phone || "N/A"}</dd>
                </dl>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Shipping</h3>
                <dl className="grid grid-cols-3 gap-y-2 text-sm">
                  <dt className="text-gray-600">Name</dt>
                  <dd className="col-span-2 text-gray-900">{data.shipping_address?.full_name || "N/A"}</dd>
                  <dt className="text-gray-600">Phone</dt>
                  <dd className="col-span-2 text-gray-900">{data.shipping_address?.phone || "N/A"}</dd>
                  <dt className="text-gray-600">Address</dt>
                  <dd className="col-span-2 text-gray-900">
                    {(data.shipping_address?.address_line1 || "") +
                      (data.shipping_address?.address_line2 ? `, ${data.shipping_address?.address_line2}` : "")}
                  </dd>
                  <dt className="text-gray-600">City</dt>
                  <dd className="col-span-2 text-gray-900">
                    {(data.shipping_address?.city || "N/A") +
                      (data.shipping_address?.state ? `, ${data.shipping_address?.state}` : "")}{" "}
                    {data.shipping_address?.postal_code || ""}
                  </dd>
                  <dt className="text-gray-600">Country</dt>
                  <dd className="col-span-2 text-gray-900">{data.shipping_address?.country || "N/A"}</dd>
                </dl>
              </div>
            </div>

            {/* Items */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h3>
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full border-collapse">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">Item</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 border-b">Unit Price</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 border-b">Quantity</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 border-b">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items?.map((item, index) => {
                      const unit = item.unit_price != null ? parseFloat(item.unit_price) : 0;
                      const qty = item.quantity || 0;
                      const line = item.line_total_price != null ? parseFloat(item.line_total_price) : unit * qty;
                      return (
                        <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                          <td className="px-4 py-3 text-sm text-gray-800 border-b">{item.item_title || "Unknown Item"}</td>
                          <td className="px-4 py-3 text-sm text-gray-800 border-b text-right">{formatINR(unit)}</td>
                          <td className="px-4 py-3 text-sm text-gray-800 border-b text-center">{qty}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 font-semibold border-b text-right">{formatINR(line)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className={`${ui.card} p-4`}>
                {data.coupon && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                    <h4 className="text-base font-semibold text-emerald-800 mb-1">Discount Applied</h4>
                    <p className="text-sm text-emerald-700">
                      <strong>Coupon:</strong> {data.coupon.code} •{" "}
                      {data.coupon.discount_type === "percentage" ? `${data.coupon.discount_value}%` : formatINR(data.coupon.discount_value)}
                    </p>
                  </div>
                )}
              </div>
              <div className={`${ui.card} p-4`}>
                <div className="flex justify-between mb-2 text-gray-700">
                  <span>Subtotal</span>
                  <span className="font-medium">{data.subtotal != null ? formatINR(data.subtotal) : formatINR(0)}</span>
                </div>
                <div className="flex justify-between mb-2 text-gray-700">
                  <span>Discount</span>
                  <span className="font-medium text-red-600">- {data.discount_amount != null ? formatINR(data.discount_amount) : formatINR(0)}</span>
                </div>
                <div className="flex justify-between pb-3 mb-3 border-b text-gray-700">
                  <span>Shipping</span>
                  <span className="font-medium">{data.shipping_charge != null ? formatINR(data.shipping_charge) : formatINR(0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">Total</span>
                  <span className="text-2xl font-bold text-gray-900">{data.total_price != null ? formatINR(data.total_price) : formatINR(0)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 p-5 bg-gray-50 flex items-center justify-end gap-3">
            <button onClick={onClose} className={ui.btnOutline}>
              Close
            </button>
            <button onClick={handleDownloadFromModal} className={ui.btnPrimary}>
              Download PDF
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-5xl mx-auto px-3 sm:px-4 lg:px-6">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900">My Orders</h1>
              <p className="mt-1 text-gray-600">Review your order history and invoices</p>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && <ErrorAlert message={error} />}

        {/* Loading */}
        {loading && (
          <div className="space-y-6">
            <SkeletonOrderCard />
            <SkeletonOrderCard />
          </div>
        )}

        {/* Content */}
        {!loading && orders.length === 0 ? (
          <div className={`${ui.card} p-12 text-center`}>
            <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No orders yet</h3>
            <p className="text-gray-600 max-w-md mx-auto">You have no orders placed yet. Start shopping to see your order history here.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const sc = statusConfig(order.status);
              return (
                <div key={order.id} className={`${ui.card} hover:shadow-md transition-all duration-200 overflow-hidden`}>
                  {/* Order Header */}
                  <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <span className={`inline-block w-2.5 h-2.5 rounded-full ${sc.dot}`} aria-hidden="true" />
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize border ${sc.chip}`}>
                            {order.status || "Processing"}
                          </span>
                        </div>
                        <div className="hidden sm:block h-6 w-px bg-gray-200" />
                        <div>
                          <p className="text-sm font-medium text-gray-500">Order ID</p>
                          <p className="text-lg font-bold text-gray-900">#{order.id}</p>
                        </div>
                      </div>

                      <div className="text-sm text-gray-600">
                        <span className="font-medium text-gray-800">Placed:</span>{" "}
                        {order.order_date ? new Date(order.order_date).toLocaleDateString() : "N/A"}
                      </div>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Items</h3>

                    <div className="space-y-4">
                      {order.items?.length > 0 ? (
                        order.items.map((item, index) => {
                          const imgSrc =
                            item.image_url?.startsWith("http") || item.image_url?.startsWith("data:")
                              ? item.image_url
                              : `${apiBaseUrl}${item.image_url || ""}`;

                          const qty = item.quantity || 0;
                          const unit = item.unit_price != null ? parseFloat(item.unit_price) : 0;
                          const line = item.line_total_price != null ? parseFloat(item.line_total_price) : unit * qty;

                          return (
                            <div
                              key={item.id ?? item.item_id ?? index}
                              className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition"
                            >
                              <img
                                src={imgSrc}
                                alt={item.item_title || "Product image"}
                                className="w-16 h-16 object-cover rounded-lg bg-white border border-gray-200 flex-shrink-0"
                                onError={(e) => {
                                  e.currentTarget.src =
                                    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239CA3AF'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' /%3E%3C/svg%3E";
                                }}
                              />
                              <div className="flex-1 min-w-0">
                                <h4 className="text-base font-medium text-gray-900 truncate">
                                  {item.item_title || "Unknown item"}
                                </h4>
                                <div className="flex items-center gap-4 mt-2 text-sm">
                                  <span className="text-gray-600">Qty: {qty}</span>
                                  <span className="text-gray-400">•</span>
                                  <span className="text-gray-600">Unit: {formatINR(unit)}</span>
                                  <span className="text-gray-400">•</span>
                                  <span className="font-semibold text-gray-900">Line: {formatINR(line)}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-xl border border-gray-200">
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
                        <span className="text-lg font-semibold text-gray-900">Total Amount</span>
                        <span className="text-2xl font-bold text-gray-900">
                          {order.total_price != null ? formatINR(order.total_price) : "N/A"}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-6 space-y-3">
                      <button
                        className={`${ui.btnPrimary} w-full font-semibold disabled:opacity-50`}
                        onClick={() => handleOrderAgain(order)}
                        disabled={reordering}
                        aria-label="Order all items again"
                      >
                        {reordering ? (
                          <span className="inline-flex items-center gap-2">
                            <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                            Adding items...
                          </span>
                        ) : (
                          "Order All Items Again"
                        )}
                      </button>

                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => handleViewInvoice(order)}
                          disabled={viewingInvoice === order.id}
                          className={`${ui.btnOutline} hover:border-blue-600 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-50`}
                          aria-label="View invoice"
                        >
                          {viewingInvoice === order.id ? (
                            <span className="inline-flex items-center gap-2 text-sm">
                              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                              Loading...
                            </span>
                          ) : (
                            "View Invoice"
                          )}
                        </button>

                        <button
                          onClick={() => handleDownloadInvoice(order)}
                          disabled={downloadingInvoice === order.id}
                          className={`${ui.btnSecondary} hover:bg-gray-200 disabled:opacity-50`}
                          aria-label="Download invoice as PDF"
                        >
                          {downloadingInvoice === order.id ? (
                            <span className="inline-flex items-center gap-2 text-sm">
                              <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
                              Generating...
                            </span>
                          ) : (
                            "Download PDF"
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Invoice Modal */}
        <InvoiceModal isOpen={invoiceModal.isOpen} data={invoiceModal.data} onClose={closeInvoiceModal} />
      </div>
    </div>
  );
}