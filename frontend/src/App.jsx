import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Dashboard from './pages/Dashboard';
import ProjectOverview from './pages/ProjectOverview';
import SessionDetail from './pages/SessionDetail';
import Review from './pages/Review';
import Offer from './pages/Offer';
import VideoCall from './pages/VideoCall';
import Consent from './pages/Consent';
import Success from './pages/Success';
import Login from './pages/Login';
import CustomerLogin from './pages/CustomerLogin';
import ChangePassword from './pages/ChangePassword';
import CustomerPortal from './pages/CustomerPortal';
import ProtectedRoute from './components/ProtectedRoute';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 4000,
      retry: 2,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Default redirect to dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/session/:id"
            element={
              <ProtectedRoute>
                <SessionDetail />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<Login />} />
          <Route path="/customer/login" element={<CustomerLogin />} />
          <Route path="/customer/change-password" element={<ChangePassword />} />
          <Route path="/customer/portal" element={<CustomerPortal />} />
          <Route path="/review" element={<Review />} />
          <Route path="/project" element={<ProjectOverview />} />
          <Route path="/offer" element={<Offer />} />
          {/* Fallback routes for Sidebar nav items that aren't built yet */}
          <Route path="/sessions" element={<Navigate to="/dashboard" replace />} />
          <Route path="/flagged" element={<Navigate to="/dashboard" replace />} />
          <Route path="/audit" element={<Navigate to="/dashboard" replace />} />
          <Route path="/history" element={<Navigate to="/dashboard" replace />} />
          <Route path="/video-call" element={<VideoCall />} />
          <Route path="/consent" element={<Consent />} />
          <Route path="/success" element={<Success />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
