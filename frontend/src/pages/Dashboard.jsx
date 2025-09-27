// import React, { useEffect, useState, useContext } from "react";
// import API from "../api/axios";
// import { addToWishlist } from "../api/wishlist";
// import { AuthContext } from "../context/AuthContext"; // assumed user context

// export default function Dashboard() {
//   const { user } = useContext(AuthContext);
//   const [me, setMe] = useState(null);
//   const [items, setItems] = useState([]);
//   const [notifications, setNotifications] = useState([]);
//   const [wishlistLoadingIds, setWishlistLoadingIds] = useState(new Set());
//   const [cart, setCart] = useState({});
//   const [cartLoadingIds, setCartLoadingIds] = useState(new Set());

//   useEffect(() => {
//     API.get("/me").then((res) => setMe(res.data));
//     API.get("/items/").then((res) => setItems(res.data));
//     API.get("/notifications").then((res) => setNotifications(res.data.slice(0, 5)));
//   }, []);

//   const handleAddToWishlist = async (itemId) => {
//     setWishlistLoadingIds((prev) => new Set(prev).add(itemId));
//     try {
//       await addToWishlist(itemId);
//       alert("Added to wishlist!");
//     } catch (err) {
//       alert("Failed to add to wishlist");
//     } finally {
//       setWishlistLoadingIds((prev) => {
//         const copy = new Set(prev);
//         copy.delete(itemId);
//         return copy;
//       });
//     }
//   };

//   const handleAddToCart = (itemId) => {
//     setCartLoadingIds((prev) => new Set(prev).add(itemId));
//     setCart((prev) => ({
//       ...prev,
//       [itemId]: (prev[itemId] || 0) + 1,
//     }));
//     setTimeout(() => {
//       setCartLoadingIds((prev) => {
//         const copy = new Set(prev);
//         copy.delete(itemId);
//         return copy;
//       });
//       alert("Added to cart!");
//     }, 500);
//   };

//   if (!me) return <div className="p-6 text-center">Loading...</div>;

//   return (
//     <div className="flex justify-center items-start min-h-screen bg-gray-100 p-6">
//       <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-5xl">
//         <h1 className="text-2xl font-bold text-blue-600 mb-4">Welcome, {me.username}</h1>
//         <p className="text-gray-700 mb-6">
//           <span className="font-semibold">Email:</span> {me.email}
//         </p>

//         {/* Items listing for customers and shop owners */}
//         {(me.role === "customer" || me.role === "shop_owner") && (
//           <>
//             <h2 className="text-xl font-semibold mb-4">Available Products</h2>
//             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//               {items.map((item) => (
//                 <div
//                   key={item.id}
//                   className="bg-white rounded-lg p-4 shadow-md flex flex-col justify-between"
//                 >
//                   <div>
//                     <h3 className="font-semibold text-lg mb-2 line-clamp-2">{item.title}</h3>
//                     <p className="text-green-700 font-bold text-xl">${item.price.toFixed(2)}</p>
//                     <p className="mb-2">
//                       Stock:{" "}
//                       <span className={item.stock === 0 ? "text-red-600 font-semibold" : "text-gray-700"}>
//                         {item.stock}
//                       </span>
//                     </p>
//                   </div>

//                   <div className="flex justify-between mt-4 space-x-2">
//                     {(me.role === "customer" || me.role === "shop_owner") && (
//                       <button
//                         onClick={() => handleAddToWishlist(item.id)}
//                         disabled={wishlistLoadingIds.has(item.id)}
//                         className={`px-3 py-1 rounded ${wishlistLoadingIds.has(item.id)
//                             ? "bg-gray-400 cursor-not-allowed"
//                             : "bg-yellow-500 hover:bg-yellow-600 text-white"
//                           }`}
//                       >
//                         {wishlistLoadingIds.has(item.id) ? "Adding..." : "Add to Wishlist"}
//                       </button>
//                     )}

//                     {me.role === "customer" && (
//                       <button
//                         onClick={() => handleAddToCart(item.id)}
//                         disabled={cartLoadingIds.has(item.id) || item.stock === 0}
//                         className={`px-3 py-1 rounded ${cartLoadingIds.has(item.id) || item.stock === 0
//                             ? "bg-gray-400 cursor-not-allowed"
//                             : "bg-blue-600 hover:bg-blue-700 text-white"
//                           }`}
//                       >
//                         {cartLoadingIds.has(item.id) ? "Adding..." : "Add to Cart"}
//                         {cart[item.id] ? ` (${cart[item.id]})` : ""}
//                       </button>
//                     )}
//                   </div>
//                 </div>

//               ))}
//             </div>
//           </>
//         )}
//         {/* Notifications (unchanged) */}
//         <div className="mt-10">
//           <h2 className="text-lg font-bold mb-2">Recent Notifications</h2>
//           {notifications.length > 0 ? (
//             <ul className="list-disc pl-5">
//               {notifications.map((n) => (
//                 <li key={n.id}>
//                   {n.message} {!n.is_read && <span className="text-xs text-red-500">(Unread)</span>}
//                 </li>
//               ))}
//             </ul>
//           ) : (
//             <p className="text-gray-500">No notifications</p>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }
