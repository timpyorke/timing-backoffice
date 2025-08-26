import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { Toaster } from 'sonner';

import ErrorBoundary from '@/components/ErrorBoundary';
import ProtectedRoute from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Orders from '@/pages/Orders';
import OrderDetails from '@/pages/OrderDetails';
import CreateOrder from '@/pages/CreateOrder';
import Menu from '@/pages/Menu';
import Sales from '@/pages/Sales';
import Settings from '@/pages/Settings';

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <AuthProvider>
          <Router>
            <div className="App">
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route
                  path="/*"
                  element={
                    <ProtectedRoute>
                      <Layout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Dashboard />} />
                  <Route path="orders" element={<Orders />} />
                  <Route path="orders/new" element={<CreateOrder />} />
                  <Route path="orders/:id" element={<OrderDetails />} />
                  <Route path="menu" element={<Menu />} />
                  <Route path="sales" element={<Sales />} />
                  <Route path="settings" element={<Settings />} />
                </Route>
              </Routes>
              <Toaster position="top-right" richColors />
            </div>
          </Router>
        </AuthProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
};

export default App;
