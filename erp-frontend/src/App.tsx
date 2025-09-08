import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { SAPLayout } from './components/Layout/SAPLayout';
import './styles/global.css';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import UsersPage from './pages/UsersPage';
import { CreateUserPage } from './pages/CreateUserPage';
import { RoleManagementPage } from './pages/RoleManagementPage';
import SecuritySettingsPage from './pages/SecuritySettingsPage';
import AccessControlPage from './pages/AccessControlPage';
import SessionManagementPage from './pages/SessionManagementPage';
import AuditLogsPage from './pages/AuditLogsPage';
import SystemSettingsPage from './pages/SystemSettingsPage';

// Inventory Pages
import InventoryDashboardPage from './pages/InventoryDashboardPage';
import ProductsPage from './pages/ProductsPage';
import CreateProductPage from './pages/CreateProductPage';
import ProductDetailPage from './pages/ProductDetailPage';
import EditProductPage from './pages/EditProductPage';
import CategoriesPage from './pages/CategoriesPage';
import WarehousesPage from './pages/WarehousesPage';
import StockManagementPage from './pages/StockManagementPage';

// Sales Pages
import SalesDashboardPage from './pages/SalesDashboardPage';
import CustomersPage from './pages/CustomersPage';
import CustomerCreateEditPage from './pages/CustomerCreateEditPage';
import CustomerDetailPage from './pages/CustomerDetailPage';
import SalesOrdersPage from './pages/SalesOrdersPage';
import SalesOrderCreateEditPage from './pages/SalesOrderCreateEditPage';
import SalesOrderDetailPage from './pages/SalesOrderDetailPage';
import QuotesPage from './pages/QuotesPage';
import InvoicesPage from './pages/InvoicesPage';

function App() {
  return (
    <Provider store={store}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected dashboard routes */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <SAPLayout />
                </ProtectedRoute>
              }
            >
                <Route index element={<DashboardPage />} />
                
                {/* Authentication & User Management Routes */}
                <Route path="users" element={<UsersPage />} />
                <Route path="users/create" element={<CreateUserPage />} />
                <Route path="roles" element={<RoleManagementPage />} />
                <Route path="security" element={<SecuritySettingsPage />} />
                <Route path="access-control" element={<AccessControlPage />} />
                <Route path="sessions" element={<SessionManagementPage />} />
                <Route path="audit" element={<AuditLogsPage />} />
                
                {/* Inventory Management Routes */}
                <Route path="inventory" element={<InventoryDashboardPage />} />
                <Route path="inventory/products" element={<ProductsPage />} />
                <Route path="inventory/products/create" element={<CreateProductPage />} />
                <Route path="inventory/products/:productId" element={<ProductDetailPage />} />
                <Route path="inventory/products/:productId/edit" element={<EditProductPage />} />
                <Route path="inventory/categories" element={<CategoriesPage />} />
                <Route path="inventory/warehouses" element={<WarehousesPage />} />
                <Route path="inventory/stock" element={<StockManagementPage />} />
                
                {/* Sales Management Routes */}
                <Route path="sales" element={<SalesDashboardPage />} />
                <Route path="sales/customers" element={<CustomersPage />} />
                <Route path="sales/customers/create" element={<CustomerCreateEditPage />} />
                <Route path="sales/customers/:customerId" element={<CustomerDetailPage />} />
                <Route path="sales/customers/:customerId/edit" element={<CustomerCreateEditPage />} />
                <Route path="sales/orders" element={<SalesOrdersPage />} />
                <Route path="sales/orders/create" element={<SalesOrderCreateEditPage />} />
                <Route path="sales/orders/:orderId" element={<SalesOrderDetailPage />} />
                <Route path="sales/orders/:orderId/edit" element={<SalesOrderCreateEditPage />} />
                <Route path="sales/quotes" element={<QuotesPage />} />
                <Route path="sales/invoices" element={<InvoicesPage />} />
                
                {/* Business Operations Routes */}
                <Route path="departments" element={<div>Departments Page (Not implemented)</div>} />
                <Route path="calendar" element={<div>Calendar Page (Not implemented)</div>} />
                <Route path="reports" element={<div>Reports Page (Not implemented)</div>} />
                
                {/* System Configuration Routes */}
                <Route path="settings" element={<SystemSettingsPage />} />
              </Route>

              {/* Default redirect to dashboard */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              
              {/* 404 Page */}
              <Route path="*" element={<div>Page Not Found</div>} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </Provider>
  );
}

export default App;
