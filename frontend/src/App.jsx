import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { AdminRoute } from './routes/AdminRoute';
import { SuperAdminRoute } from './routes/SuperAdminRoute';
import { MainLayout } from './layouts/MainLayout';
import { AdminLayout } from './layouts/AdminLayout';
import { SuperAdminLayout } from './layouts/SuperAdminLayout';
import LoginPage from './features/auth/LoginPage';
import RegisterPage from './features/auth/RegisterPage';
import FeedPage from './features/feed/FeedPage';
import NetworkPage from './features/network/NetworkPage';
import MessagesPage from './features/messages/MessagesPage';
import YearbookPage from './features/yearbook/YearbookPage';
import NotificationsPage from './features/notifications/NotificationsPage';
import GroupsPage from './features/groups/GroupsPage';
import ProfilePage from './features/profile/ProfilePage';
import SavedPostsPage from './features/saved/SavedPostsPage';
import InstitutionNewsPage from './features/news/InstitutionNewsPage';
import BirthdaysPage from './features/birthdays/BirthdaysPage';
import InstitutionEventsPage from './features/events/InstitutionEventsPage';
import NewsFeedsPage from './features/newsfeeds/NewsFeedsPage';
import AdminEventsPage from './features/admin/AdminEventsPage';
import AdminStructurePage from './features/admin/AdminStructurePage';
import AdminStudentsPage from './features/admin/AdminStudentsPage';
import AdminBroadcastsPage from './features/admin/AdminBroadcastsPage';
import AdminYearbookPage from './features/admin/AdminYearbookPage';
import AdminModerationPage from './features/admin/AdminModerationPage';
import AdminIndex from './features/admin/AdminIndex';
import SuperAdminDashboardPage from './features/superadmin/SuperAdminDashboardPage';
import { RoleGate } from './components/RoleGate';
import { ADMIN_SECTION_ROLES } from './constants/adminRoles';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/" element={<FeedPage />} />
          <Route path="/network" element={<NetworkPage />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/yearbook" element={<YearbookPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/groups" element={<GroupsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/:id" element={<ProfilePage />} />
          <Route path="/saved" element={<SavedPostsPage />} />
          <Route path="/institution-news" element={<InstitutionNewsPage />} />
          <Route path="/birthdays" element={<BirthdaysPage />} />
          <Route path="/institution-events" element={<InstitutionEventsPage />} />
          <Route path="/news-feeds" element={<NewsFeedsPage />} />
        </Route>

        <Route element={<AdminRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminIndex />} />
            <Route
              path="/admin/structure"
              element={
                <RoleGate allow={ADMIN_SECTION_ROLES.structure}>
                  <AdminStructurePage />
                </RoleGate>
              }
            />
            <Route
              path="/admin/students"
              element={
                <RoleGate allow={ADMIN_SECTION_ROLES.students}>
                  <AdminStudentsPage />
                </RoleGate>
              }
            />
            <Route
              path="/admin/broadcasts"
              element={
                <RoleGate allow={ADMIN_SECTION_ROLES.broadcasts}>
                  <AdminBroadcastsPage />
                </RoleGate>
              }
            />
            <Route
              path="/admin/events"
              element={
                <RoleGate allow={ADMIN_SECTION_ROLES.events}>
                  <AdminEventsPage />
                </RoleGate>
              }
            />
            <Route
              path="/admin/yearbook"
              element={
                <RoleGate allow={ADMIN_SECTION_ROLES.yearbook}>
                  <AdminYearbookPage />
                </RoleGate>
              }
            />
            <Route
              path="/admin/moderation"
              element={
                <RoleGate allow={ADMIN_SECTION_ROLES.moderation}>
                  <AdminModerationPage />
                </RoleGate>
              }
            />
          </Route>
        </Route>

        <Route element={<SuperAdminRoute />}>
          <Route element={<SuperAdminLayout />}>
            <Route path="/super-admin" element={<SuperAdminDashboardPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="/404" element={<NotFound />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
}
