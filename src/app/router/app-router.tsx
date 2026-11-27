import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { PublicLayout } from '@/app/layouts/public-layout'
import { AuthGuard } from '@/app/guards/auth-guard'
import { BusinessAccessGuard } from '@/app/guards/business-access-guard'
import { BusinessPermissionGuard } from '@/app/guards/business-permission-guard'
import { PlatformAdminGuard } from '@/app/guards/platform-admin-guard'
import { PageLoader } from '@/shared/components/page-loader'

const LandingPage = lazy(() => import('@/features/marketing/pages/landing-page'))
const AuthPage = lazy(() => import('@/features/auth/pages/auth-page'))
const AuthCallbackPage = lazy(() => import('@/features/auth/pages/auth-callback-page'))
const BusinessPublicPage = lazy(() => import('@/features/booking/pages/business-public-page'))
const BookingPage = lazy(() => import('@/features/booking/pages/booking-page'))
const BusinessDashboardPage = lazy(
  () => import('@/features/businesses/pages/business-dashboard-page')
)
const OnboardingPage = lazy(() => import('@/features/onboarding/pages/onboarding-page'))
const CatalogPage = lazy(() => import('@/features/catalog/pages/catalog-page'))
const TeamPage = lazy(() => import('@/features/team/pages/team-page'))
const BusinessSettingsPage = lazy(
  () => import('@/features/businesses/pages/business-settings-page')
)
const CustomerAppointmentsPage = lazy(
  () => import('@/features/appointments/pages/customer-appointments-page')
)
const BusinessAppointmentsPage = lazy(
  () => import('@/features/appointments/pages/business-appointments-page')
)
const CustomersPage = lazy(() => import('@/features/customers/pages/customers-page'))
const PlatformDashboardPage = lazy(
  () => import('@/features/platform/pages/platform-dashboard-page')
)
const BusinessOperationsPage = lazy(
  () => import('@/features/operations/pages/business-operations-page')
)
const BusinessGrowthPage = lazy(() => import('@/features/growth/pages/business-growth-page'))
const ForbiddenPage = lazy(() => import('@/shared/pages/forbidden-page'))
const NotFoundPage = lazy(() => import('@/shared/pages/not-found-page'))

export function AppRouter() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<LandingPage />} />
          <Route path="login" element={<AuthPage mode="login" />} />
          <Route path="register" element={<AuthPage mode="register" />} />
          <Route path="auth/callback" element={<AuthCallbackPage />} />
          <Route path="b/:slug" element={<BusinessPublicPage />} />
          <Route path="b/:slug/book" element={<BookingPage />} />
          <Route path="pricing" element={<Navigate to="/#isletmeler" replace />} />
        </Route>
        <Route
          path="onboarding"
          element={
            <AuthGuard>
              <OnboardingPage />
            </AuthGuard>
          }
        />
        <Route
          path="business/:businessId"
          element={
            <BusinessAccessGuard>
              <BusinessDashboardPage />
            </BusinessAccessGuard>
          }
        />
        <Route
          path="business/:businessId/catalog"
          element={
            <BusinessAccessGuard>
              <BusinessPermissionGuard permissions={['branches.manage', 'services.manage']}>
                <CatalogPage />
              </BusinessPermissionGuard>
            </BusinessAccessGuard>
          }
        />
        <Route
          path="business/:businessId/team"
          element={
            <BusinessAccessGuard>
              <BusinessPermissionGuard permissions={['staff.manage']}>
                <TeamPage />
              </BusinessPermissionGuard>
            </BusinessAccessGuard>
          }
        />
        <Route
          path="business/:businessId/settings"
          element={
            <BusinessAccessGuard>
              <BusinessPermissionGuard permissions={['settings.manage']}>
                <BusinessSettingsPage />
              </BusinessPermissionGuard>
            </BusinessAccessGuard>
          }
        />
        <Route
          path="business/:businessId/appointments"
          element={
            <BusinessAccessGuard>
              <BusinessPermissionGuard permissions={['appointments.read']}>
                <BusinessAppointmentsPage />
              </BusinessPermissionGuard>
            </BusinessAccessGuard>
          }
        />
        <Route
          path="business/:businessId/customers"
          element={
            <BusinessAccessGuard>
              <BusinessPermissionGuard permissions={['customers.read']}>
                <CustomersPage />
              </BusinessPermissionGuard>
            </BusinessAccessGuard>
          }
        />
        <Route
          path="business/:businessId/operations"
          element={
            <BusinessAccessGuard>
              <BusinessPermissionGuard permissions={['reports.view']}>
                <BusinessOperationsPage />
              </BusinessPermissionGuard>
            </BusinessAccessGuard>
          }
        />
        <Route
          path="business/:businessId/growth"
          element={
            <BusinessAccessGuard>
              <BusinessPermissionGuard permissions={['customers.read']}>
                <BusinessGrowthPage />
              </BusinessPermissionGuard>
            </BusinessAccessGuard>
          }
        />
        <Route
          path="platform"
          element={
            <PlatformAdminGuard>
              <PlatformDashboardPage />
            </PlatformAdminGuard>
          }
        />
        <Route
          path="app/appointments"
          element={
            <AuthGuard>
              <CustomerAppointmentsPage />
            </AuthGuard>
          }
        />
        <Route path="forbidden" element={<ForbiddenPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  )
}
