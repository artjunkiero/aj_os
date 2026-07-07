import React from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { Toaster } from "sonner";

import { AuthProvider, useAuth } from "@/lib/auth";

import LoginPage from "@/pages/Login";
import ClientLogin from "@/pages/client/Login";
import ReferPage from "@/pages/Refer";

import AdminLayout from "@/pages/admin/Layout";
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminCustomers from "@/pages/admin/Customers";
import AdminCustomerDetail from "@/pages/admin/CustomerDetail";
import AdminLeads from "@/pages/admin/Leads";
import AdminEmployees from "@/pages/admin/Employees";
import AdminMeasurements from "@/pages/admin/Measurements";
import AdminInstallations from "@/pages/admin/Installations";
import AdminWorkOrders from "@/pages/admin/WorkOrders";
import AdminProduction from "@/pages/admin/Production";
import AdminCalendar from "@/pages/admin/CalendarPage";
import AdminWarranties from "@/pages/admin/Warranties";
import AdminService from "@/pages/admin/Service";
import AdminNotifications from "@/pages/admin/Notifications";
import AdminReports from "@/pages/admin/Reports";
import AdminSettings from "@/pages/admin/Settings";
import AdminReferrals from "@/pages/admin/Referrals";

import EmployeeLayout from "@/pages/employee/Layout";
import EmployeeHome from "@/pages/employee/Home";
import EmployeeToday from "@/pages/employee/Today";
import EmployeeMeasurements from "@/pages/employee/Measurements";
import EmployeeInstallations from "@/pages/employee/Installations";
import EmployeeService from "@/pages/employee/Service";
import EmployeeWorkDetail from "@/pages/employee/WorkDetail";

import ClientLayout from "@/pages/client/Layout";
import ClientDashboard from "@/pages/client/Dashboard";
import ClientOrders from "@/pages/client/Orders";
import ClientOrderDetail from "@/pages/client/OrderDetail";
import ClientWarranties from "@/pages/client/Warranties";
import ClientService from "@/pages/client/Service";
import ClientDocuments from "@/pages/client/Documents";
import ClientMessages from "@/pages/client/Messages";
import ClientReferrals from "@/pages/client/Referrals";

const ADMIN_ROLES = ["super_admin", "admin", "sales"];

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center" data-testid="loading-screen">
      <div className="text-aj-navy font-semibold tracking-tight">ART JUNKIE OS…</div>
    </div>
  );
}

function StaffGuard({ children, allowRoles }) {
  const { user } = useAuth();
  if (user === undefined) return <LoadingScreen />;
  if (!user) return <Navigate to="/admin/login" replace />;
  if (allowRoles && !allowRoles.includes(user.role) && user.role !== "super_admin") {
    // employees redirected to employee shell
    return <Navigate to="/app/azi" replace />;
  }
  return children ?? <Outlet />;
}

function EmployeeGuard({ children }) {
  const { user } = useAuth();
  if (user === undefined) return <LoadingScreen />;
  if (!user) return <Navigate to="/app/login" replace />;
  return children ?? <Outlet />;
}

function ClientGuard({ children }) {
  const { client } = useAuth();
  if (client === undefined) return <LoadingScreen />;
  if (!client) return <Navigate to="/client/login" replace />;
  return children ?? <Outlet />;
}

function RootRedirect() {
  const { user, client } = useAuth();
  if (user === undefined || client === undefined) return <LoadingScreen />;
  if (user) {
    if (ADMIN_ROLES.includes(user.role) || user.role === "super_admin") return <Navigate to="/admin/dashboard" replace />;
    return <Navigate to="/app/azi" replace />;
  }
  if (client) return <Navigate to="/client" replace />;
  return <Navigate to="/admin/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster richColors position="top-right" />
        <Routes>
          <Route path="/" element={<RootRedirect />} />

          {/* Auth pages */}
          <Route path="/admin/login" element={<LoginPage variant="admin" />} />
          <Route path="/app/login" element={<LoginPage variant="employee" />} />
          <Route path="/client/login" element={<ClientLogin />} />
          <Route path="/refer/:code" element={<ReferPage />} />

          {/* Admin routes */}
          <Route element={<StaffGuard allowRoles={ADMIN_ROLES} />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="clienti" element={<AdminCustomers />} />
              <Route path="clienti/:id" element={<AdminCustomerDetail />} />
              <Route path="leaduri" element={<AdminLeads />} />
              <Route path="angajati" element={<AdminEmployees />} />
              <Route path="masuratori" element={<AdminMeasurements />} />
              <Route path="montaj" element={<AdminInstallations />} />
              <Route path="lucrari" element={<AdminWorkOrders />} />
              <Route path="productie" element={<AdminProduction />} />
              <Route path="calendar" element={<AdminCalendar />} />
              <Route path="garantii" element={<AdminWarranties />} />
              <Route path="service" element={<AdminService />} />
              <Route path="notificari" element={<AdminNotifications />} />
              <Route path="rapoarte" element={<AdminReports />} />
              <Route path="recomandari" element={<AdminReferrals />} />
              <Route path="setari" element={<AdminSettings />} />
            </Route>
          </Route>

          {/* Employee routes */}
          <Route element={<EmployeeGuard />}>
            <Route path="/app" element={<EmployeeLayout />}>
              <Route index element={<Navigate to="azi" replace />} />
              <Route path="dashboard" element={<EmployeeHome />} />
              <Route path="azi" element={<EmployeeToday />} />
              <Route path="masuratori" element={<EmployeeMeasurements />} />
              <Route path="montaje" element={<EmployeeInstallations />} />
              <Route path="service" element={<EmployeeService />} />
              <Route path="lucrare/:kind/:id" element={<EmployeeWorkDetail />} />
            </Route>
          </Route>

          {/* Client portal */}
          <Route element={<ClientGuard />}>
            <Route path="/client" element={<ClientLayout />}>
              <Route index element={<ClientDashboard />} />
              <Route path="comenzi" element={<ClientOrders />} />
              <Route path="comenzi/:id" element={<ClientOrderDetail />} />
              <Route path="garantii" element={<ClientWarranties />} />
              <Route path="service" element={<ClientService />} />
              <Route path="recomanda" element={<ClientReferrals />} />
              <Route path="documente" element={<ClientDocuments />} />
              <Route path="mesaje" element={<ClientMessages />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
