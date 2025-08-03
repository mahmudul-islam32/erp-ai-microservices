import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MantineProvider, ColorSchemeProvider, ColorScheme } from '@mantine/core';
import { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DashboardLayout } from './layouts/DashboardLayout';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import UsersPage from './pages/UsersPage';

function App() {
  const [colorScheme, setColorScheme] = useState<ColorScheme>('light');
  const toggleColorScheme = (value?: ColorScheme) =>
    setColorScheme(value || (colorScheme === 'dark' ? 'light' : 'dark'));

  return (
    <ColorSchemeProvider colorScheme={colorScheme} toggleColorScheme={toggleColorScheme}>
      <MantineProvider theme={{ colorScheme }} withGlobalStyles withNormalizeCSS>
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
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<DashboardPage />} />
                <Route path="users" element={<UsersPage />} />
                {/* Add more dashboard routes here */}
                <Route path="departments" element={<div>Departments Page (Not implemented)</div>} />
                <Route path="calendar" element={<div>Calendar Page (Not implemented)</div>} />
                <Route path="reports" element={<div>Reports Page (Not implemented)</div>} />
                <Route path="settings" element={<div>Settings Page (Not implemented)</div>} />
              </Route>

              {/* Default redirect to dashboard */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              
              {/* 404 Page */}
              <Route path="*" element={<div>Page Not Found</div>} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </MantineProvider>
    </ColorSchemeProvider>
  );
}

export default App;
