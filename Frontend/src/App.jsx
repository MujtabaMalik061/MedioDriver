import { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import "./assets/style/Style.css";
import LandingPage from "./pages/LandingPage.jsx";
import SignIn from "./auth/SignIn.jsx";
import SignUp from "./auth/SignUp.jsx";
import { PublicRoute, ProtectedRoute, AdminRoute } from "./routes/RouteGuards.jsx";
import AppLayout from "./layout/AppLayout.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import UploadMedia from "./pages/UploadMedia.jsx";
import MediaRecords from "./pages/MediaRecords.jsx";
import APISection from "./pages/APISection.jsx";
import Settings from "./pages/Settings.jsx";
import PaymentSuccess from "./components/PaymentSuccess.jsx";
import Payments from "./pages/Payments.jsx";
import AdminUsers from "./pages/admin/AdminUsers.jsx";
import AdminUserDetail from "./pages/admin/AdminUserDetail.jsx";

const App = () => {
  return (
    <>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/signin"
          element={
            <PublicRoute>
              <SignIn />
            </PublicRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <PublicRoute>
              <SignUp />
            </PublicRoute>
          }
        />
        <Route element={<AppLayout />}>
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/upload-media"
            element={
              <ProtectedRoute role={["user", "premium"]}>
                <UploadMedia />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payment-success"
            element={
              <ProtectedRoute>
                <PaymentSuccess />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payments"
            element={
              <ProtectedRoute>
                <Payments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/media-records"
            element={
              <ProtectedRoute>
                <MediaRecords />
              </ProtectedRoute>
            }
          />
          <Route
            path="/api-section"
            element={
              <ProtectedRoute>
                <APISection />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <AdminRoute>
                <AdminUsers />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/users/:userId"
            element={
              <AdminRoute>
                <AdminUserDetail />
              </AdminRoute>
            }
          />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

export default App;
