import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { Toaster } from 'sonner';
import { store } from './app/store';
import { LoginPage } from './features/auth/pages/LoginPage';
import { ProtectedRoute } from './features/auth/components/ProtectedRoute';
import { PermissionRoute } from './shared/components/PermissionRoute';
import { MainLayout } from './shared/components/layout/MainLayout';
import { AppearanceLoader } from './shared/components/AppearanceLoader';
import { AppearanceProvider } from './shared/contexts/AppearanceContext';
import { Permission, UserRole } from './features/users/types';


import { DashboardPage } from './features/dashboard/pages/DashboardPage';


import { UsersPage } from './features/users/pages/UsersPage';
import { CreateUserPage } from './features/users/pages/CreateUserPage';
import { EditUserPage } from './features/users/pages/EditUserPage';
import { UserDetailPage } from './features/users/pages/UserDetailPage';
import { RolesPage } from './features/users/pages/RolesPage';
import { SecurityPage } from './features/users/pages/SecurityPage';
import { AccessControlPage } from './features/users/pages/AccessControlPage';
import { SessionsPage } from './features/users/pages/SessionsPage';
import { AuditLogsPage } from './features/users/pages/AuditLogsPage';
import { AIChatbotPage } from './features/ai-chatbot/pages/AIChatbotPage';

// Inventory
import { InventoryDashboardPage } from './features/inventory/pages/InventoryDashboardPage';
import { ProductsPage } from './features/inventory/pages/ProductsPage';
import { CreateProductPage } from './features/inventory/pages/CreateProductPage';
import { EditProductPage } from './features/inventory/pages/EditProductPage';
import { ProductDetailPage } from './features/inventory/pages/ProductDetailPage';
import { CategoriesPage } from './features/inventory/pages/CategoriesPage';
import { WarehousesPage } from './features/inventory/pages/WarehousesPage';
import { StockManagementPage } from './features/inventory/pages/StockManagementPage';
import { InventorySettingsPage } from './features/inventory/pages/InventorySettingsPage';

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
import { CreateInvoicePage } from './features/sales/pages/CreateInvoicePage';
import { InvoiceDetailPage } from './features/sales/pages/InvoiceDetailPage';
import { SalesSettingsPage } from './features/sales/pages/SalesSettingsPage';

// Chat
import { ChatPage } from './features/chat';

// Notifications
import { NotificationsPage } from './features/notifications/pages/NotificationsPage';

// Finance
import { 
  FinanceDashboardPage,
  ChartOfAccountsPage,
  JournalEntriesPage,
  FinancialReportsPage,
  FinancialSettingsPage,
} from './features/finance';

// HRM
import { 
  HRMDashboardPage, 
  EmployeesPage, 
  PayrollPage, 
  AttendancePage, 
  LeavePage, 
  PerformancePage, 
  RecruitmentPage, 
  TrainingPage, 
  BenefitsPage, 
  AnalyticsPage 
} from './features/hrm';

// Settings
import { SettingsPage } from './features/dashboard/pages/SettingsPage';
import { AppearanceSettingsPage } from './features/dashboard/pages/AppearanceSettingsPage';
// Profile
import { ProfileSettingsPage } from './features/auth/pages/ProfileSettingsPage';

function App() {
  return (
    <Provider store={store}>
      <AppearanceProvider>
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
            <Route 
              index 
              element={
                <PermissionRoute excludedRole={UserRole.CUSTOMER}>
                  <DashboardPage />
                </PermissionRoute>
              } 
            />

            {/* User Management */}
            <Route 
              path="users" 
              element={
                <PermissionRoute requiredPermission={Permission.USER_READ}>
                  <UsersPage />
                </PermissionRoute>
              } 
            />
            <Route 
              path="users/create" 
              element={
                <PermissionRoute requiredPermission={Permission.USER_CREATE}>
                  <CreateUserPage />
                </PermissionRoute>
              } 
            />
            <Route 
              path="users/:id" 
              element={
                <PermissionRoute requiredPermissions={[Permission.USER_READ]}>
                  <UserDetailPage />
                </PermissionRoute>
              } 
            />
            <Route 
              path="users/:id/edit" 
              element={
                <PermissionRoute requiredPermission={Permission.USER_UPDATE}>
                  <EditUserPage />
                </PermissionRoute>
              } 
            />
            <Route 
              path="roles" 
              element={
                <PermissionRoute requiredPermission={Permission.USER_READ}>
                  <RolesPage />
                </PermissionRoute>
              } 
            />
            <Route path="security" element={<SecurityPage />} />
            <Route 
              path="access-control" 
              element={
                <PermissionRoute requiredRole={UserRole.SUPER_ADMIN}>
                  <AccessControlPage />
                </PermissionRoute>
              } 
            />
            <Route 
              path="sessions" 
              element={
                <PermissionRoute requiredPermission={Permission.USER_READ}>
                  <SessionsPage />
                </PermissionRoute>
              } 
            />
            <Route 
              path="audit" 
              element={
                <PermissionRoute requiredPermission={Permission.USER_READ}>
                  <AuditLogsPage />
                </PermissionRoute>
              } 
            />

            {/* Inventory */}
            <Route 
              path="inventory" 
              element={
                <PermissionRoute requiredService="inventory">
                  <InventoryDashboardPage />
                </PermissionRoute>
              } 
            />
            <Route 
              path="inventory/products" 
              element={
                <PermissionRoute requiredPermission={Permission.INVENTORY_READ}>
                  <ProductsPage />
                </PermissionRoute>
              } 
            />
            <Route 
              path="inventory/products/create" 
              element={
                <PermissionRoute requiredPermission={Permission.INVENTORY_CREATE}>
                  <CreateProductPage />
                </PermissionRoute>
              } 
            />
            <Route 
              path="inventory/products/:id" 
              element={
                <PermissionRoute requiredPermission={Permission.INVENTORY_READ}>
                  <ProductDetailPage />
                </PermissionRoute>
              } 
            />
            <Route 
              path="inventory/products/:id/edit" 
              element={
                <PermissionRoute requiredPermission={Permission.INVENTORY_UPDATE}>
                  <EditProductPage />
                </PermissionRoute>
              } 
            />
            <Route 
              path="inventory/categories" 
              element={
                <PermissionRoute requiredPermission={Permission.INVENTORY_READ}>
                  <CategoriesPage />
                </PermissionRoute>
              } 
            />
            <Route 
              path="inventory/warehouses" 
              element={
                <PermissionRoute requiredPermission={Permission.INVENTORY_READ}>
                  <WarehousesPage />
                </PermissionRoute>
              } 
            />
            <Route 
              path="inventory/stock" 
              element={
                <PermissionRoute requiredPermission={Permission.INVENTORY_READ}>
                  <StockManagementPage />
                </PermissionRoute>
              } 
            />
            <Route 
              path="inventory/settings" 
              element={
                <PermissionRoute requiredPermission={Permission.INVENTORY_UPDATE}>
                  <InventorySettingsPage />
                </PermissionRoute>
              } 
            />

            {/* Sales */}
            <Route 
              path="sales" 
              element={
                <PermissionRoute requiredService="sales" excludedRole={UserRole.CUSTOMER}>
                  <SalesDashboardPage />
                </PermissionRoute>
              } 
            />
            <Route 
              path="sales/customers" 
              element={
                <PermissionRoute requiredPermission={Permission.SALES_READ} excludedRole={UserRole.CUSTOMER}>
                  <CustomersPage />
                </PermissionRoute>
              } 
            />
            <Route 
              path="sales/customers/create" 
              element={
                <PermissionRoute requiredPermission={Permission.SALES_CREATE} excludedRole={UserRole.CUSTOMER}>
                  <CreateCustomerPage />
                </PermissionRoute>
              } 
            />
            <Route 
              path="sales/customers/:id" 
              element={
                <PermissionRoute requiredPermission={Permission.SALES_READ} excludedRole={UserRole.CUSTOMER}>
                  <CustomerDetailPage />
                </PermissionRoute>
              } 
            />
            <Route 
              path="sales/customers/:id/edit" 
              element={
                <PermissionRoute requiredPermission={Permission.SALES_UPDATE} excludedRole={UserRole.CUSTOMER}>
                  <EditCustomerPage />
                </PermissionRoute>
              } 
            />
            <Route 
              path="sales/orders" 
              element={
                <PermissionRoute requiredPermission={Permission.SALES_READ}>
                  <OrdersPage />
                </PermissionRoute>
              } 
            />
            <Route 
              path="sales/orders/create" 
              element={
                <PermissionRoute requiredPermission={Permission.SALES_CREATE}>
                  <CreateOrderPage />
                </PermissionRoute>
              } 
            />
            <Route 
              path="sales/orders/:id" 
              element={
                <PermissionRoute requiredPermission={Permission.SALES_READ}>
                  <OrderDetailPage />
                </PermissionRoute>
              } 
            />
            <Route 
              path="sales/orders/:id/edit" 
              element={
                <PermissionRoute requiredPermission={Permission.SALES_UPDATE}>
                  <EditOrderPage />
                </PermissionRoute>
              } 
            />
            <Route 
              path="sales/quotes" 
              element={
                <PermissionRoute requiredPermission={Permission.SALES_READ} excludedRole={UserRole.CUSTOMER}>
                  <QuotesPage />
                </PermissionRoute>
              } 
            />
            <Route 
              path="sales/invoices" 
              element={
                <PermissionRoute requiredPermission={Permission.SALES_READ}>
                  <InvoicesPage />
                </PermissionRoute>
              } 
            />
            <Route 
              path="sales/invoices/create" 
              element={
                <PermissionRoute requiredPermission={Permission.SALES_CREATE}>
                  <CreateInvoicePage />
                </PermissionRoute>
              } 
            />
            <Route 
              path="sales/invoices/:id" 
              element={
                <PermissionRoute requiredPermission={Permission.SALES_READ}>
                  <InvoiceDetailPage />
                </PermissionRoute>
              } 
            />
            <Route 
              path="sales/settings" 
              element={
                <PermissionRoute requiredPermission={Permission.SALES_UPDATE}>
                  <SalesSettingsPage />
                </PermissionRoute>
              } 
            />

            {/* Chat */}
            <Route path="messages" element={<ChatPage />} />

            {/* AI Assistant */}
            <Route 
              path="ai-assistant" 
              element={
                <PermissionRoute requiredService="ai" excludedRole={UserRole.CUSTOMER}>
                  <AIChatbotPage />
                </PermissionRoute>
              } 
            />

            {/* Notifications */}
            <Route path="notifications" element={<NotificationsPage />} />

            {/* Finance */}
            <Route 
              path="finance" 
              element={
                <PermissionRoute requiredService="finance">
                  <FinanceDashboardPage />
                </PermissionRoute>
              } 
            />
            <Route 
              path="finance/accounts" 
              element={
                <PermissionRoute requiredPermission={Permission.FINANCE_READ}>
                  <ChartOfAccountsPage />
                </PermissionRoute>
              } 
            />
            <Route 
              path="finance/journal-entries" 
              element={
                <PermissionRoute requiredPermission={Permission.FINANCE_READ}>
                  <JournalEntriesPage />
                </PermissionRoute>
              } 
            />
            <Route 
              path="finance/reports" 
              element={
                <PermissionRoute requiredPermission={Permission.FINANCE_READ}>
                  <FinancialReportsPage />
                </PermissionRoute>
              } 
            />
            <Route 
              path="finance/settings" 
              element={
                <PermissionRoute requiredPermission={Permission.FINANCE_UPDATE}>
                  <FinancialSettingsPage />
                </PermissionRoute>
              } 
            />

            {/* HRM */}
            <Route 
              path="hrm" 
              element={
                <PermissionRoute requiredService="hr">
                  <HRMDashboardPage />
                </PermissionRoute>
              } 
            />
            <Route 
              path="hrm/employees" 
              element={
                <PermissionRoute requiredPermission={Permission.HR_READ}>
                  <EmployeesPage />
                </PermissionRoute>
              } 
            />
            <Route 
              path="hrm/payroll" 
              element={
                <PermissionRoute requiredPermission={Permission.HR_READ}>
                  <PayrollPage />
                </PermissionRoute>
              } 
            />
            <Route 
              path="hrm/attendance" 
              element={
                <PermissionRoute requiredPermission={Permission.HR_READ}>
                  <AttendancePage />
                </PermissionRoute>
              } 
            />
            <Route 
              path="hrm/leave" 
              element={
                <PermissionRoute requiredPermission={Permission.HR_READ}>
                  <LeavePage />
                </PermissionRoute>
              } 
            />
            <Route 
              path="hrm/performance" 
              element={
                <PermissionRoute requiredPermission={Permission.HR_READ}>
                  <PerformancePage />
                </PermissionRoute>
              } 
            />
            <Route 
              path="hrm/recruitment" 
              element={
                <PermissionRoute requiredPermission={Permission.HR_READ}>
                  <RecruitmentPage />
                </PermissionRoute>
              } 
            />
            <Route 
              path="hrm/training" 
              element={
                <PermissionRoute requiredPermission={Permission.HR_READ}>
                  <TrainingPage />
                </PermissionRoute>
              } 
            />
            <Route 
              path="hrm/benefits" 
              element={
                <PermissionRoute requiredPermission={Permission.HR_READ}>
                  <BenefitsPage />
                </PermissionRoute>
              } 
            />
            <Route 
              path="hrm/analytics" 
              element={
                <PermissionRoute requiredPermission={Permission.HR_READ}>
                  <AnalyticsPage />
                </PermissionRoute>
              } 
            />

            {/* Settings */}
            <Route 
              path="settings" 
              element={
                <PermissionRoute requiredPermission={Permission.SETTINGS_READ}>
                  <SettingsPage />
                </PermissionRoute>
              } 
            />
            <Route 
              path="settings/appearance" 
              element={
                <PermissionRoute requiredPermission={Permission.SETTINGS_READ}>
                  <AppearanceSettingsPage />
                </PermissionRoute>
              } 
            />
            
            {/* Profile */}
            <Route path="profile" element={<ProfileSettingsPage />} />
          </Route>

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          {/* 404 */}
          <Route path="*" element={<div className="flex items-center justify-center min-h-screen"><h1 className="text-2xl font-bold">404 - Page Not Found</h1></div>} />
        </Routes>
      </BrowserRouter>
      </AppearanceProvider>
    </Provider>
  );
}

export default App;
