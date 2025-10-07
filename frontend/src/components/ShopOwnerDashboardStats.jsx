// // components/ShopOwnerDashboardStats.jsx
// import React from 'react';

// const ShopOwnerDashboardStats = ({ 
//   items = [], 
//   orders = [], 
//   coupons = [] 
// }) => {
//   // FIX: Handle nested array structure
//   const actualOrders = Array.isArray(orders[0]) ? orders[0] : orders;
  
//   console.log('=== DASHBOARD DEBUG ===');
//   console.log('Actual orders:', actualOrders);
//   console.log('Actual orders length:', actualOrders.length);

//   // Calculate metrics using actualOrders instead of orders
//   const totalProducts = items.length;
//   const totalOrders = actualOrders.length;
//   const totalCoupons = coupons.length;
  
//   // Calculate revenue (excluding cancelled orders)
//   const totalRevenue = actualOrders
//     .filter(order => order.status !== 'cancelled')
//     .reduce((total, order) => {
//       const orderTotal = order.items?.reduce((sum, item) => sum + (item.line_total_price || 0), 0) || 0;
//       return total + orderTotal;
//     }, 0);

//   // Order status breakdown - use actualOrders
//   const orderStatusCount = {
//     pending: actualOrders.filter(o => o.status === 'pending').length,
//     processing: actualOrders.filter(o => o.status === 'processing').length,
//     shipped: actualOrders.filter(o => o.status === 'shipped').length,
//     delivered: actualOrders.filter(o => o.status === 'delivered').length,
//     cancelled: actualOrders.filter(o => o.status === 'cancelled').length,
//   };

//   // Low stock items
//   const lowStockItems = items.filter(item => item.low_stock_alert || item.stock < 10);
  
//   // Active coupons
//   const activeCoupons = coupons.filter(coupon => coupon.active);

//   // Recent orders (last 5) - use actualOrders
//   const recentOrders = actualOrders.slice(0, 5);

//   const formatCurrency = (amount) => {
//     return new Intl.NumberFormat('en-IN', {
//       style: 'currency',
//       currency: 'INR',
//       minimumFractionDigits: 2
//     }).format(amount);
//   };

//   const getStatusColor = (status) => {
//     const colors = {
//       pending: 'bg-yellow-100 text-yellow-800',
//       processing: 'bg-blue-100 text-blue-800',
//       shipped: 'bg-purple-100 text-purple-800',
//       delivered: 'bg-green-100 text-green-800',
//       cancelled: 'bg-red-100 text-red-800'
//     };
//     return colors[status] || 'bg-gray-100 text-gray-800';
//   };

//   return (
//     <div className="space-y-6">
//       {/* Stats Grid */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//         {/* Revenue Card */}
//         <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
//           <div className="flex items-center">
//             <div className="p-3 bg-green-100 rounded-lg">
//               <span className="text-green-600 text-xl">💰</span>
//             </div>
//             <div className="ml-4">
//               <p className="text-sm font-medium text-gray-600">Total Revenue</p>
//               <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalRevenue)}</p>
//             </div>
//           </div>
//           <div className="mt-4 pt-4 border-t border-gray-100">
//             <p className="text-xs text-gray-500">Excluding cancelled orders</p>
//           </div>
//         </div>

//         {/* Orders Card */}
//         <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
//           <div className="flex items-center">
//             <div className="p-3 bg-blue-100 rounded-lg">
//               <span className="text-blue-600 text-xl">📦</span>
//             </div>
//             <div className="ml-4">
//               <p className="text-sm font-medium text-gray-600">Total Orders</p>
//               <p className="text-2xl font-bold text-gray-900">{totalOrders}</p>
//             </div>
//           </div>
//           <div className="mt-2">
//             <p className="text-xs text-gray-600">
//               {orderStatusCount.pending} pending • {orderStatusCount.processing} processing
//             </p>
//           </div>
//         </div>

//         {/* Products Card */}
//         <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
//           <div className="flex items-center">
//             <div className="p-3 bg-purple-100 rounded-lg">
//               <span className="text-purple-600 text-xl">🛍️</span>
//             </div>
//             <div className="ml-4">
//               <p className="text-sm font-medium text-gray-600">Products</p>
//               <p className="text-2xl font-bold text-gray-900">{totalProducts}</p>
//             </div>
//           </div>
//           <div className="mt-2">
//             <p className="text-xs text-gray-600">
//               {lowStockItems.length} low stock
//             </p>
//           </div>
//         </div>

//         {/* Coupons Card */}
//         <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
//           <div className="flex items-center">
//             <div className="p-3 bg-orange-100 rounded-lg">
//               <span className="text-orange-600 text-xl">🎫</span>
//             </div>
//             <div className="ml-4">
//               <p className="text-sm font-medium text-gray-600">Active Coupons</p>
//               <p className="text-2xl font-bold text-gray-900">{activeCoupons.length}</p>
//             </div>
//           </div>
//           <div className="mt-2">
//             <p className="text-xs text-gray-600">
//               {totalCoupons} total coupons
//             </p>
//           </div>
//         </div>
//       </div>

//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//         {/* Recent Orders */}
//         <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
//           <div className="flex items-center justify-between mb-4">
//             <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
//             <span className="text-sm text-gray-500">Last 5 orders</span>
//           </div>
//           <div className="space-y-3">
//             {recentOrders.length === 0 ? (
//               <p className="text-gray-500 text-center py-4">No recent orders</p>
//             ) : (
//               recentOrders.map((order) => (
//                 <div key={order.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
//                   <div>
//                     <p className="font-medium text-gray-900">#{order.id}</p>
//                     <p className="text-sm text-gray-500">
//                       {order.items?.length || 0} items
//                     </p>
//                   </div>
//                   <div className="text-right">
//                     <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
//                       {order.status}
//                     </span>
//                     <p className="text-sm font-medium text-gray-900 mt-1">
//                       {formatCurrency(
//                         order.items?.reduce((sum, item) => sum + (item.line_total_price || 0), 0) || 0
//                       )}
//                     </p>
//                   </div>
//                 </div>
//               ))
//             )}
//           </div>
//         </div>

//         {/* Quick Stats */}
//         <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
//           <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Status Breakdown</h3>
//           <div className="space-y-3">
//             {Object.entries(orderStatusCount).map(([status, count]) => (
//               <div key={status} className="flex items-center justify-between">
//                 <span className="text-sm font-medium text-gray-600 capitalize">
//                   {status}
//                 </span>
//                 <span className="text-sm font-semibold text-gray-900">
//                   {count}
//                 </span>
//               </div>
//             ))}
//           </div>

//           {/* Low Stock Alert */}
//           {lowStockItems.length > 0 && (
//             <div className="mt-6 pt-4 border-t border-gray-100">
//               <h4 className="text-sm font-semibold text-red-700 mb-2">Low Stock Alert</h4>
//               <div className="space-y-2">
//                 {lowStockItems.slice(0, 3).map((item) => (
//                   <div key={item.id} className="flex items-center justify-between text-sm">
//                     <span className="text-gray-700 truncate">{item.title}</span>
//                     <span className="text-red-600 font-medium">Stock: {item.stock}</span>
//                   </div>
//                 ))}
//                 {lowStockItems.length > 3 && (
//                   <p className="text-xs text-gray-500">
//                     +{lowStockItems.length - 3} more items low in stock
//                   </p>
//                 )}
//               </div>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ShopOwnerDashboardStats;



// components/ShopOwnerDashboardStats.jsx
import React from 'react';

const ShopOwnerDashboardStats = ({ 
  items = [], 
  orders = [], 
  coupons = [] 
}) => {
  // FIX: Handle nested array structure
  const actualOrders = Array.isArray(orders[0]) ? orders[0] : orders;
  
  // Calculate metrics using actualOrders instead of orders
  const totalProducts = items.length;
  const totalOrders = actualOrders.length;
  const totalCoupons = coupons.length;
  
  // Calculate revenue (excluding cancelled orders)
  const totalRevenue = actualOrders
    .filter(order => order.status !== 'cancelled')
    .reduce((total, order) => {
      const orderTotal = order.items?.reduce((sum, item) => sum + (item.line_total_price || 0), 0) || 0;
      return total + orderTotal;
    }, 0);

  // Order status breakdown - use actualOrders
  const orderStatusCount = {
    pending: actualOrders.filter(o => o.status === 'pending').length,
    processing: actualOrders.filter(o => o.status === 'processing').length,
    shipped: actualOrders.filter(o => o.status === 'shipped').length,
    delivered: actualOrders.filter(o => o.status === 'delivered').length,
    cancelled: actualOrders.filter(o => o.status === 'cancelled').length,
  };

  // Low stock items
  const lowStockItems = items.filter(item => item.low_stock_alert || item.stock < 10);
  
  // Active coupons
  const activeCoupons = coupons.filter(coupon => coupon.active);

  // Recent orders (last 5) - use actualOrders
  const recentOrders = actualOrders.slice(0, 5);

  // Top selling products based on actual order data
  const topSellingProducts = items
    .map(item => {
      const itemOrders = actualOrders.flatMap(order => 
        order.items?.filter(orderItem => orderItem.item_id === item.id) || []
      );
      const totalSold = itemOrders.reduce((sum, orderItem) => sum + (orderItem.quantity || 0), 0);
      const revenue = itemOrders.reduce((sum, orderItem) => sum + (orderItem.line_total_price || 0), 0);
      
      return {
        ...item,
        totalSold,
        revenue
      };
    })
    .sort((a, b) => b.totalSold - a.totalSold)
    .slice(0, 5);

  // Revenue by product based on actual data
  const revenueByProduct = items
    .map(item => {
      const itemOrders = actualOrders.flatMap(order => 
        order.items?.filter(orderItem => orderItem.item_id === item.id) || []
      );
      const revenue = itemOrders.reduce((sum, orderItem) => sum + (orderItem.line_total_price || 0), 0);
      
      return {
        name: item.title,
        revenue
      };
    })
    .filter(product => product.revenue > 0)
    .sort((a, b) => b.revenue - a.revenue);

  // Order value distribution based on actual orders
  const orderValueRanges = [
    { range: '0-1000', count: 0 },
    { range: '1001-5000', count: 0 },
    { range: '5001-10000', count: 0 },
    { range: '10000+', count: 0 }
  ];

  actualOrders.forEach(order => {
    const orderTotal = order.items?.reduce((sum, item) => sum + (item.line_total_price || 0), 0) || 0;
    if (orderTotal <= 1000) orderValueRanges[0].count++;
    else if (orderTotal <= 5000) orderValueRanges[1].count++;
    else if (orderTotal <= 10000) orderValueRanges[2].count++;
    else orderValueRanges[3].count++;
  });

  // Daily orders (last 7 days based on order_date if available)
  const dailyOrders = actualOrders.reduce((acc, order) => {
    if (order.order_date) {
      const date = new Date(order.order_date).toLocaleDateString();
      acc[date] = (acc[date] || 0) + 1;
    }
    return acc;
  }, {});

  const dailyOrdersData = Object.entries(dailyOrders).map(([date, count]) => ({
    date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    count
  })).slice(-7); // Last 7 days

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  // Calculate percentages for order status chart
  const orderStatusData = Object.entries(orderStatusCount).map(([status, count]) => ({
    status,
    count,
    percentage: totalOrders > 0 ? (count / totalOrders) * 100 : 0
  }));

  // Calculate average order value
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Revenue Card */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <span className="text-green-600 text-xl">💰</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalRevenue)}</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500">Excluding cancelled orders</p>
          </div>
        </div>

        {/* Orders Card */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <span className="text-blue-600 text-xl">📦</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{totalOrders}</p>
            </div>
          </div>
          <div className="mt-2">
            <p className="text-xs text-gray-600">
              {orderStatusCount.pending} pending • {orderStatusCount.processing} processing
            </p>
          </div>
        </div>

        {/* Products Card */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <span className="text-purple-600 text-xl">🛍️</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Products</p>
              <p className="text-2xl font-bold text-gray-900">{totalProducts}</p>
            </div>
          </div>
          <div className="mt-2">
            <p className="text-xs text-gray-600">
              {lowStockItems.length} low stock
            </p>
          </div>
        </div>

        {/* Coupons Card */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 rounded-lg">
              <span className="text-orange-600 text-xl">🎫</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Coupons</p>
              <p className="text-2xl font-bold text-gray-900">{activeCoupons.length}</p>
            </div>
          </div>
          <div className="mt-2">
            <p className="text-xs text-gray-600">
              {totalCoupons} total coupons
            </p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Status Distribution */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Status Distribution</h3>
          <div className="space-y-4">
            {orderStatusData.map(({ status, count, percentage }) => (
              <div key={status} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-600 capitalize">{status}</span>
                  <span className="text-gray-900">{count} ({percentage.toFixed(1)}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      status === 'delivered' ? 'bg-green-500' :
                      status === 'shipped' ? 'bg-purple-500' :
                      status === 'processing' ? 'bg-blue-500' :
                      status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue by Product */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Product</h3>
          <div className="space-y-3">
            {revenueByProduct.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No revenue data available</p>
            ) : (
              revenueByProduct.map((product, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600 truncate max-w-[120px]">
                    {product.name}
                  </span>
                  <div className="flex-1 mx-4">
                    <div className="bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ 
                          width: `${(product.revenue / Math.max(...revenueByProduct.map(p => p.revenue))) * 100}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 w-20 text-right">
                    {formatCurrency(product.revenue)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Products */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Top Selling Products</h3>
            <span className="text-sm text-gray-500">By units sold</span>
          </div>
          <div className="space-y-4">
            {topSellingProducts.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No sales data available</p>
            ) : (
              topSellingProducts.map((product, index) => (
                <div key={product.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 text-sm font-bold">{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm truncate max-w-[150px]">
                        {product.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        Sold: {product.totalSold} units
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">
                      {formatCurrency(product.revenue)}
                    </p>
                    <p className="text-xs text-gray-500">Revenue</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Order Value Distribution */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Value Distribution</h3>
          <div className="space-y-3">
            {orderValueRanges.map((range, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600 w-20">₹{range.range}</span>
                <div className="flex-1 mx-4">
                  <div className="bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-500 h-2 rounded-full"
                      style={{ 
                        width: `${totalOrders > 0 ? (range.count / totalOrders) * 100 : 0}%` 
                      }}
                    ></div>
                  </div>
                </div>
                <span className="text-sm font-semibold text-gray-900 w-8 text-right">
                  {range.count}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-500">Based on {totalOrders} orders</p>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Avg. Order Value</span>
              <span className="text-sm font-semibold text-blue-600">
                {formatCurrency(averageOrderValue)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Fulfillment Rate</span>
              <span className="text-sm font-semibold text-green-600">
                {totalOrders > 0 ? ((orderStatusCount.delivered / totalOrders) * 100).toFixed(1) : 0}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Cancellation Rate</span>
              <span className="text-sm font-semibold text-red-600">
                {totalOrders > 0 ? ((orderStatusCount.cancelled / totalOrders) * 100).toFixed(1) : 0}%
              </span>
            </div>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
            <span className="text-sm text-gray-500">Last 5 orders</span>
          </div>
          <div className="space-y-3">
            {recentOrders.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No recent orders</p>
            ) : (
              recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">#{order.id}</p>
                    <p className="text-sm text-gray-500">
                      {order.items?.length || 0} items
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                    <p className="text-sm font-medium text-gray-900 mt-1">
                      {formatCurrency(
                        order.items?.reduce((sum, item) => sum + (item.line_total_price || 0), 0) || 0
                      )}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Business Overview</h3>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-600 mb-2">Order Status</h4>
              {Object.entries(orderStatusCount).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-600 capitalize">{status}</span>
                  <span className="font-semibold text-gray-900">{count}</span>
                </div>
              ))}
            </div>
            
            {/* Low Stock Alert */}
            <div>
              <h4 className="text-sm font-medium text-gray-600 mb-2">Inventory Status</h4>
              {lowStockItems.length > 0 ? (
                <div className="space-y-1">
                  {lowStockItems.slice(0, 2).map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700 truncate max-w-[100px]">{item.title}</span>
                      <span className="text-red-600 font-medium">{item.stock}</span>
                    </div>
                  ))}
                  {lowStockItems.length > 2 && (
                    <p className="text-xs text-gray-500 mt-1">
                      +{lowStockItems.length - 2} more low stock
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-green-600">All items well stocked</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopOwnerDashboardStats;