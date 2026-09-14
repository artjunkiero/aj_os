import React, { lazy, Suspense } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import { Toaster } from "sonner";

import { AuthProvider, useAuth } from "@/lib/auth";

/*
 * Pagini mici / autentificare
 */
import LoginPage from "@/pages/Login";
import ClientLogin from "@/pages/client/Login";
import ReferPage from "@/pages/Refer";

/*
 * ADMIN - lazy loaded
 */
const AdminLayout = lazy(() => import("@/pages/admin/Layout"));
const AdminDashboard = lazy(() => import("@/pages/admin/Dashboard"));
const AdminCustomers = lazy(() => import("@/pages/admin/Customers"));
const AdminCustomerDetail = lazy(() =>
  import("@/pages/admin/CustomerDetail")
);
const AdminLeads = lazy(() => import("@/pages/admin/Leads"));
const AdminEmployees = lazy(() => import("@/pages/admin/Employees"));
const AdminMeasurements = lazy(() =>
  import("@/pages/admin/Measurements")
);
const AdminInstallations = lazy(() =>
  import("@/pages/admin/Installations")
);
const AdminWorkOrders = lazy(() =>
  import("@/pages/admin/WorkOrders")
);
const AdminProduction = lazy(() =>
  import("@/pages/admin/Production")
);
const AdminCalendar = lazy(() =>
  import("@/pages/admin/CalendarPage")
);
const AdminWarranties = lazy(() =>
  import("@/pages/admin/Warranties")
);
const AdminService = lazy(() => import("@/pages/admin/Service"));
const AdminNotifications = lazy(() =>
  import("@/pages/admin/Notifications")
);
const AdminReports = lazy(() => import("@/pages/admin/Reports"));
const AdminSettings = lazy(() => import("@/pages/admin/Settings"));
const AdminReferrals = lazy(() =>
  import("@/pages/admin/Referrals")
);

/*
 * EMPLOYEE - lazy loaded
 */
const EmployeeLayout = lazy(() =>
  import("@/pages/employee/Layout")
);
const EmployeeHome = lazy(() =>
  import("@/pages/employee/Home")
);
const EmployeeToday = lazy(() =>
  import("@/pages/employee/Today")
);
const EmployeeMeasurements = lazy(() =>
  import("@/pages/employee/Measurements")
);
const EmployeeInstallations = lazy(() =>
  import("@/pages/employee/Installations")
);
const EmployeeService = lazy(() =>
  import("@/pages/employee/Service")
);
const EmployeeWorkDetail = lazy(() =>
  import("@/pages/employee/WorkDetail")
);

/*
 * CLIENT - lazy loaded
 */
const ClientLayout = lazy(() =>
  import("@/pages/client/Layout")
);
const ClientDashboard = lazy(() =>
  import("@/pages/client/Dashboard")
);
const ClientOrders = lazy(() =>
  import("@/pages/client/Orders")
);
const ClientOrderDetail = lazy(() =>
  import("@/pages/client/OrderDetail")
);
const ClientWarranties = lazy(() =>
  import("@/pages/client/Warranties")
);
const ClientService = lazy(() =>
  import("@/pages/client/Service")
);
const ClientDocuments = lazy(() =>
  import("@/pages/client/Documents")
);
const ClientMessages = lazy(() =>
  import("@/pages/client/Messages")
);
const ClientReferrals = lazy(() =>
  import("@/pages/client/Referrals")
);

const ADMIN_ROLES = [
  "super_admin",
  "admin",
  "sales",
];

function LoadingScreen() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      data-testid="loading-screen"
    >
      <div className="text-aj-navy font-semibold tracking-tight">
        ART JUNKIE OS…
      </div>
    </div>
  );
}

/*
 * ADMIN GUARD
 */
function StaffGuard({ children, allowRoles }) {
  const { user } = useAuth();

  if (user === undefined) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  if (
    allowRoles &&
    !allowRoles.includes(user.role) &&
    user.role !== "super_admin"
  ) {
    return <Navigate to="/app/azi" replace />;
  }

  return children ?? <Outlet />;
}

/*
 * EMPLOYEE GUARD
 */
function EmployeeGuard({ children }) {
  const { user } = useAuth();

  if (user === undefined) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/app/login" replace />;
  }

  return children ?? <Outlet />;
}

/*
 * CLIENT GUARD
 */
function ClientGuard({ children }) {
  const { client } = useAuth();

  if (client === undefined) {
    return <LoadingScreen />;
  }

  if (!client) {
    return <Navigate to="/client/login" replace />;
  }

  return children ?? <Outlet />;
}

/*
 * REDIRECT ROOT
 *
 * Se folosește doar atunci când utilizatorul
 * intră direct pe domeniul principal "/".
 */
function RootRedirect() {
  const { user, client } = useAuth();

  if (
    user === undefined ||
    client === undefined
  ) {
    return <LoadingScreen />;
  }

  if (user) {
    if (
      ADMIN_ROLES.includes(user.role) ||
      user.role === "super_admin"
    ) {
      return (
        <Navigate
          to="/admin/dashboard"
          replace
        />
      );
    }

    return (
      <Navigate
        to="/app/azi"
        replace
      />
    );
  }

  if (client) {
    return (
      <Navigate
        to="/client"
        replace
      />
    );
  }

  return (
    <Navigate
      to="/admin/login"
      replace
    />
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          richColors
          position="top-right"
        />

        <Suspense fallback={<LoadingScreen />}>
          <Routes>

            {/* ROOT */}
            <Route
              path="/"
              element={<RootRedirect />}
            />

            {/* AUTH */}
            <Route
              path="/admin/login"
              element={
                <LoginPage variant="admin" />
              }
            />

            <Route
              path="/app/login"
              element={
                <LoginPage variant="employee" />
              }
            />

            <Route
              path="/client/login"
              element={<ClientLogin />}
            />

            <Route
              path="/refer/:code"
              element={<ReferPage />}
            />

            {/* ADMIN */}
            <Route
              element={
                <StaffGuard
                  allowRoles={ADMIN_ROLES}
                />
              }
            >
              <Route
                path="/admin"
                element={<AdminLayout />}
              >
                <Route
                  index
                  element={
                    <Navigate
                      to="dashboard"
                      replace
                    />
                  }
                />

                <Route
                  path="dashboard"
                  element={<AdminDashboard />}
                />

                <Route
                  path="clienti"
                  element={<AdminCustomers />}
                />

                <Route
                  path="clienti/:id"
                  element={<AdminCustomerDetail />}
                />

                <Route
                  path="leaduri"
                  element={<AdminLeads />}
                />

                <Route
                  path="angajati"
                  element={<AdminEmployees />}
                />

                <Route
                  path="masuratori"
                  element={<AdminMeasurements />}
                />

                <Route
                  path="montaj"
                  element={<AdminInstallations />}
                />

                <Route
                  path="lucrari"
                  element={<AdminWorkOrders />}
                />

                <Route
                  path="productie"
                  element={<AdminProduction />}
                />

                <Route
                  path="calendar"
                  element={<AdminCalendar />}
                />

                <Route
                  path="garantii"
                  element={<AdminWarranties />}
                />

                <Route
                  path="service"
                  element={<AdminService />}
                />

                <Route
                  path="notificari"
                  element={<AdminNotifications />}
                />

                <Route
                  path="rapoarte"
                  element={<AdminReports />}
                />

                <Route
                  path="recomandari"
                  element={<AdminReferrals />}
                />

                <Route
                  path="setari"
                  element={<AdminSettings />}
                />
              </Route>
            </Route>

            {/* EMPLOYEE */}
            <Route
              element={<EmployeeGuard />}
            >
              <Route
                path="/app"
                element={<EmployeeLayout />}
              >
                <Route
                  index
                  element={
                    <Navigate
                      to="azi"
                      replace
                    />
                  }
                />

                <Route
                  path="dashboard"
                  element={<EmployeeHome />}
                />

                <Route
                  path="azi"
                  element={<EmployeeToday />}
                />

                <Route
                  path="masuratori"
                  element={<EmployeeMeasurements />}
                />

                <Route
                  path="montaje"
                  element={<EmployeeInstallations />}
                />

                <Route
                  path="service"
                  element={<EmployeeService />}
                />

                <Route
                  path="lucrare/:kind/:id"
                  element={<EmployeeWorkDetail />}
                />
              </Route>
            </Route>

            {/* CLIENT */}
            <Route
              element={<ClientGuard />}
            >
              <Route
                path="/client"
                element={<ClientLayout />}
              >
                <Route
                  index
                  element={<ClientDashboard />}
                />

                <Route
                  path="comenzi"
                  element={<ClientOrders />}
                />

                <Route
                  path="comenzi/:id"
                  element={<ClientOrderDetail />}
                />

                <Route
                  path="garantii"
                  element={<ClientWarranties />}
                />

                <Route
                  path="service"
                  element={<ClientService />}
                />

                <Route
                  path="recomanda"
                  element={<ClientReferrals />}
                />

                <Route
                  path="documente"
                  element={<ClientDocuments />}
                />

                <Route
                  path="mesaje"
                  element={<ClientMessages />}
                />
              </Route>
            </Route>

            {/*
             * Rută necunoscută:
             * mergem direct la login Admin,
             * NU prin "/".
             *
             * Astfel evităm refresh-ul inutil
             * al ambelor sesiuni.
             */}
            <Route
              path="*"
              element={
                <Navigate
                  to="/admin/login"
                  replace
                />
              }
            />

          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}
