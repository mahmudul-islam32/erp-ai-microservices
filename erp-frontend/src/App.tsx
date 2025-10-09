import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { Toaster } from 'sonner';
import { store } from './app/store';
import { LoginPage } from './features/auth/pages/LoginPage';
import { ProtectedRoute } from './features/auth/components/ProtectedRoute';
import { MainLayout } from './shared/components/layout/MainLayout';


import { DashboardPage } from './features/dashboard/pages/DashboardPage';


import { UsersPage } from './features/users/pages/UsersPage';
import { CreateUserPage } from './features/users/pages/CreateUserPage';
import { RolesPage } from './features/users/pages/RolesPage';
import { SecurityPage } from './features/users/pages/SecurityPage';
import { AccessControlPage } from './features/users/pages/AccessControlPage';
import { SessionsPage } from './features/users/pages/SessionsPage';
import { AuditLogsPage } from './features/users/pages/AuditLogsPage';

// Inventory
import { InventoryDashboardPage } from './features/inventory/pages/InventoryDashboardPage';
import { ProductsPage } from './features/inventory/pages/ProductsPage';
import { CreateProductPage } from './features/inventory/pages/CreateProductPage';
import { EditProductPage } from './features/inventory/pages/EditProductPage';
import { ProductDetailPage } from './features/inventory/pages/ProductDetailPage';
import { CategoriesPage } from './features/inventory/pages/CategoriesPage';
import { WarehousesPage } from './features/inventory/pages/WarehousesPage';
import { StockManagementPage } from './features/inventory/pages/StockManagementPage';

// Sales
import { SalesDashboardPage } from './features/sales/pages/SalesDashboardPage';
import { CustomersPage } from './features/sales/pages/CustomersPage';
import { CreateCustomerPage } from './features/sales/pages/CreateCustomerPage';
import { EditCustomerPage } from './features/sales/pages/EditCustomerPage';
import { CustomerDetailPage } from './features/sales/pages/CustomerDetailPage';
import { OrdersPage } from './features/sales/pages/OrdersPage';
import { CreateOrderPage } from './features/sales/pages/CreateOrderPage';
import { EditOrderPage } from './features/sales/pages/EditOrderPage';
import { OrderDetailPage } from './features/sales/pages/OrderDetailPage';
import { QuotesPage } from './features/sales/pages/QuotesPage';
import { InvoicesPage } from './features/sales/pages/InvoicesPage';

// Settings
import { SettingsPage } from './features/dashboard/pages/SettingsPage';

function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <Toaster position="top-right" richColors />
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />

            {/* User Management */}
            <Route path="users" element={<UsersPage />} />
            <Route path="users/create" element={<CreateUserPage />} />
            <Route path="roles" element={<RolesPage />} />
            <Route path="security" element={<SecurityPage />} />
            <Route path="access-control" element={<AccessControlPage />} />
            <Route path="sessions" element={<SessionsPage />} />
            <Route path="audit" element={<AuditLogsPage />} />

            {/* Inventory */}
            <Route path="inventory" element={<InventoryDashboardPage />} />
            <Route path="inventory/products" element={<ProductsPage />} />
            <Route path="inventory/products/create" element={<CreateProductPage />} />
            <Route path="inventory/products/:id" element={<ProductDetailPage />} />
            <Route path="inventory/products/:id/edit" element={<EditProductPage />} />
            <Route path="inventory/categories" element={<CategoriesPage />} />
            <Route path="inventory/warehouses" element={<WarehousesPage />} />
            <Route path="inventory/stock" element={<StockManagementPage />} />

            {/* Sales */}
            <Route path="sales" element={<SalesDashboardPage />} />
            <Route path="sales/customers" element={<CustomersPage />} />
            <Route path="sales/customers/create" element={<CreateCustomerPage />} />
            <Route path="sales/customers/:id" element={<CustomerDetailPage />} />
            <Route path="sales/customers/:id/edit" element={<EditCustomerPage />} />
            <Route path="sales/orders" element={<OrdersPage />} />
            <Route path="sales/orders/create" element={<CreateOrderPage />} />
            <Route path="sales/orders/:id" element={<OrderDetailPage />} />
            <Route path="sales/orders/:id/edit" element={<EditOrderPage />} />
            <Route path="sales/quotes" element={<QuotesPage />} />
            <Route path="sales/invoices" element={<InvoicesPage />} />

            {/* Settings */}
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          {/* 404 */}
          <Route path="*" element={<div className="flex items-center justify-center min-h-screen"><h1 className="text-2xl font-bold">404 - Page Not Found</h1></div>} />
        </Routes>
      </BrowserRouter>
    </Provider>
  );
}

export default App;
