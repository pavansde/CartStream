const AdminDashboardStats = ({ 
  users = [], 
  items = [], 
  orders = [], 
  coupons = [] 
}) => {
  // Handle nested array structure if needed
  const actualOrders = Array.isArray(orders[0]) ? orders[0] : orders;
  const actualItems = Array.isArray(items[0]) ? items[0] : items;
  const actualUsers = Array.isArray(users[0]) ? users[0] : users;
  const actualCoupons = Array.isArray(coupons[0]) ? coupons[0] : coupons;

  // Calculate metrics
  const totalUsers = actualUsers.length;
  const totalProducts = actualItems.length;
  const totalOrders = actualOrders.length;
  const totalCoupons = actualCoupons.length;

  // User role distribution
  const userRoleDistribution = actualUsers.reduce((acc, user) => {
    acc[user.role] = (acc[user.role] || 0) + 1;
    return acc;
  }, {});

  // Revenue calculation (excluding cancelled orders)
  const totalRevenue = actualOrders
    .filter(order => order.status !== 'cancelled')
    .reduce((total, order) => total + (order.total_price || 0), 0);

  // Order status breakdown
  const orderStatusCount = {
    pending: actualOrders.filter(o => o.status === 'pending').length,
    processing: actualOrders.filter(o => o.status === 'processing').length,
    shipped: actualOrders.filter(o => o.status === 'shipped').length,
    delivered: actualOrders.filter(o => o.status === 'delivered').length,
    cancelled: actualOrders.filter(o => o.status === 'cancelled').length,
  };

  // Low stock items
  const lowStockItems = actualItems.filter(item => item.low_stock_alert || item.stock < 10);

  // Active coupons
  const activeCoupons = actualCoupons.filter(coupon => coupon.active || coupon.is_active);

  // Shop owner performance
  const shopOwnerPerformance = actualItems.reduce((acc, item) => {
    if (item.owner_username) {
      if (!acc[item.owner_username]) {
        acc[item.owner_username] = {
          productCount: 0,
          lowStockCount: 0,
          totalStock: 0
        };
      }
      acc[item.owner_username].productCount++;
      acc[item.owner_username].totalStock += item.stock || 0;
      if (item.low_stock_alert || (item.stock || 0) < 10) {
        acc[item.owner_username].lowStockCount++;
      }
    }
    return acc;
  }, {});

  // Revenue by shop owner
  const revenueByShopOwner = actualOrders.reduce((acc, order) => {
    if (order.shop_owner_name && order.status !== 'cancelled') {
      acc[order.shop_owner_name] = (acc[order.shop_owner_name] || 0) + (order.total_price || 0);
    }
    return acc;
  }, {});

  // Order value distribution
  const orderValueRanges = [
    { range: '0-1000', count: 0 },
    { range: '1001-5000', count: 0 },
    { range: '5001-10000', count: 0 },
    { range: '10000+', count: 0 }
  ];

  actualOrders.forEach(order => {
    const orderTotal = order.total_price || 0;
    if (orderTotal <= 1000) orderValueRanges[0].count++;
    else if (orderTotal <= 5000) orderValueRanges[1].count++;
    else if (orderTotal <= 10000) orderValueRanges[2].count++;
    else orderValueRanges[3].count++;
  });

  // Coupon performance
  const couponPerformance = actualCoupons.map(coupon => ({
    ...coupon,
    usageRate: coupon.max_uses ? ((coupon.used_count || 0) / coupon.max_uses) * 100 : 0
  }));

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Calculate percentages for charts
  const orderStatusData = Object.entries(orderStatusCount).map(([status, count]) => ({
    status,
    count,
    percentage: totalOrders > 0 ? (count / totalOrders) * 100 : 0
  }));

  const userRoleData = Object.entries(userRoleDistribution).map(([role, count]) => ({
    role,
    count,
    percentage: totalUsers > 0 ? (count / totalUsers) * 100 : 0
  }));

  return (
    <div className="space-y-6">
      {/* Platform Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Revenue */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <span className="text-green-600 text-xl">💰</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Platform Revenue</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalRevenue)}</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500">Excluding cancelled orders</p>
          </div>
        </div>

        {/* Total Users */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <span className="text-blue-600 text-xl">👥</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{totalUsers}</p>
            </div>
          </div>
          <div className="mt-2">
            <p className="text-xs text-gray-600">
              {userRoleDistribution.customer || 0} customers • {userRoleDistribution.ShopOwner || 0} shop owners
            </p>
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <span className="text-purple-600 text-xl">📦</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{totalOrders}</p>
            </div>
          </div>
          <div className="mt-2">
            <p className="text-xs text-gray-600">
              {orderStatusCount.delivered} delivered • {orderStatusCount.pending} pending
            </p>
          </div>
        </div>

        {/* Platform Health */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 rounded-lg">
              <span className="text-orange-600 text-xl">📊</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Platform Health</p>
              <p className="text-2xl font-bold text-gray-900">{totalProducts}</p>
            </div>
          </div>
          <div className="mt-2">
            <p className="text-xs text-gray-600">
              {lowStockItems.length} low stock • {activeCoupons.length} active coupons
            </p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Distribution */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">User Distribution</h3>
          <div className="space-y-4">
            {userRoleData.map(({ role, count, percentage }) => (
              <div key={role} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-600 capitalize">{role}</span>
                  <span className="text-gray-900">{count} ({percentage.toFixed(1)}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      role === 'admin' ? 'bg-red-500' :
                      role === 'ShopOwner' ? 'bg-blue-500' :
                      role === 'customer' ? 'bg-green-500' : 'bg-gray-500'
                    }`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

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
      </div>

      {/* Shop Owner Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Shop Owner Revenue */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Shop Owner Revenue</h3>
          <div className="space-y-3">
            {Object.entries(revenueByShopOwner).length === 0 ? (
              <p className="text-gray-500 text-center py-4">No revenue data available</p>
            ) : (
              Object.entries(revenueByShopOwner)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
                .map(([shopOwner, revenue]) => (
                  <div key={shopOwner} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600 truncate max-w-[120px]">
                      {shopOwner}
                    </span>
                    <div className="flex-1 mx-4">
                      <div className="bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ 
                            width: `${(revenue / Math.max(...Object.values(revenueByShopOwner))) * 100}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 w-20 text-right">
                      {formatCurrency(revenue)}
                    </span>
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

      {/* Platform Performance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Performance Metrics */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Platform Metrics</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Avg. Order Value</span>
              <span className="text-sm font-semibold text-blue-600">
                {formatCurrency(totalOrders > 0 ? totalRevenue / totalOrders : 0)}
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
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Shop Owner Ratio</span>
              <span className="text-sm font-semibold text-purple-600">
                {totalUsers > 0 ? (((userRoleDistribution.ShopOwner || 0) / totalUsers) * 100).toFixed(1) : 0}%
              </span>
            </div>
          </div>
        </div>

        {/* Low Stock Overview */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Low Stock Alert</h3>
            <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
              {lowStockItems.length} items
            </span>
          </div>
          <div className="space-y-3">
            {lowStockItems.length === 0 ? (
              <p className="text-green-600 text-center py-4">All items well stocked</p>
            ) : (
              lowStockItems.slice(0, 4).map((item) => (
                <div key={item.id} className="flex items-center justify-between p-2 hover:bg-red-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 text-sm truncate max-w-[120px]">
                      {item.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      Owner: {item.owner_username}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-red-600 font-semibold text-sm">Stock: {item.stock}</span>
                  </div>
                </div>
              ))
            )}
            {lowStockItems.length > 4 && (
              <p className="text-center text-sm text-gray-500">
                +{lowStockItems.length - 4} more items low in stock
              </p>
            )}
          </div>
        </div>

        {/* Active Promotions */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Active Promotions</h3>
            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
              {activeCoupons.length} active
            </span>
          </div>
          <div className="space-y-3">
            {activeCoupons.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No active promotions</p>
            ) : (
              activeCoupons.slice(0, 3).map((coupon) => (
                <div key={coupon.id} className="p-2 rounded-lg border border-green-200 bg-green-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{coupon.code}</p>
                      <p className="text-xs text-gray-600 truncate max-w-[120px]">{coupon.description}</p>
                    </div>
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                      {coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : `₹${coupon.discount_value}`}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-1 text-xs text-gray-500">
                    <span>Uses: {coupon.used_count || 0}/{coupon.max_uses || '∞'}</span>
                  </div>
                </div>
              ))
            )}
            {activeCoupons.length > 3 && (
              <p className="text-center text-sm text-gray-500">
                +{activeCoupons.length - 3} more active
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardStats;