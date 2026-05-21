import { BrowserRouter, Routes, Route, useLocation, Outlet } from 'react-router-dom'
import { useEffect, lazy, Suspense, useState } from 'react'
import NavBar from './components/NavBar'
import Footer from './components/Footer'
import HomePage from './pages/HomePage'
import ProtectedRoute from './components/ProtectedRoute'
import CampaignBanner from './components/CampaignBanner'
import { usePopupCampaigns } from './hooks/usePopupCampaigns'

// Lazy loaded public pages
const ProductsPage = lazy(() => import('./pages/ProductsPage'))
const AboutPage = lazy(() => import('./pages/AboutPage'))
const ContactPage = lazy(() => import('./pages/ContactPage'))
const DealershipPage = lazy(() => import('./pages/DealershipPage'))

// Lazy loaded admin pages
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'))
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'))
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const ManageProducts = lazy(() => import('./pages/admin/ManageProducts'))
const AddProduct = lazy(() => import('./pages/admin/AddProduct'))
const ManageSiteImages = lazy(() => import('./pages/admin/ManageSiteImages'))
const ManageMediaReviews = lazy(() => import('./pages/admin/ManageMediaReviews'))
const ManagePopups = lazy(() => import('./pages/admin/ManagePopups'))

const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
    <div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
  </div>
)

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

const PublicLayout = () => (
  <>
    <NavBar />
    <Outlet />
    <Footer />
  </>
);

function ActiveCampaigns() {
  const { activeCampaigns } = usePopupCampaigns()
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  const handleDismiss = (id: string) => {
    setDismissed(prev => new Set(prev).add(id))
  }

  const visibleCampaigns = activeCampaigns.filter(c => !dismissed.has(c.id))
  const popupCampaign = visibleCampaigns.find(c => c.display_mode === 'popup')
  const bannerCampaigns = visibleCampaigns.filter(c => c.display_mode !== 'popup')

  return (
    <>
      {bannerCampaigns.map(c => (
        <CampaignBanner key={c.id} campaign={c} onDismiss={handleDismiss} />
      ))}
      {popupCampaign && (
        <CampaignBanner campaign={popupCampaign} onDismiss={handleDismiss} />
      )}
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <ActiveCampaigns />
      <Routes>
        {/* Admin Routes */}
        <Route path="/admin/login" element={<Suspense fallback={<LoadingSpinner />}><AdminLogin /></Suspense>} />
        <Route element={<ProtectedRoute />}>
          <Route path="/admin" element={<Suspense fallback={<LoadingSpinner />}><AdminLayout /></Suspense>}>
            <Route index element={<Suspense fallback={<LoadingSpinner />}><AdminDashboard /></Suspense>} />
            <Route path="products" element={<Suspense fallback={<LoadingSpinner />}><ManageProducts /></Suspense>} />
            <Route path="products/add" element={<Suspense fallback={<LoadingSpinner />}><AddProduct /></Suspense>} />
            <Route path="site-images" element={<Suspense fallback={<LoadingSpinner />}><ManageSiteImages /></Suspense>} />
            <Route path="media-reviews" element={<Suspense fallback={<LoadingSpinner />}><ManageMediaReviews /></Suspense>} />
            <Route path="popups" element={<Suspense fallback={<LoadingSpinner />}><ManagePopups /></Suspense>} />
          </Route>
        </Route>

        {/* Public Routes */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<Suspense fallback={<LoadingSpinner />}><ProductsPage /></Suspense>} />
          <Route path="/about" element={<Suspense fallback={<LoadingSpinner />}><AboutPage /></Suspense>} />
          <Route path="/contact" element={<Suspense fallback={<LoadingSpinner />}><ContactPage /></Suspense>} />
          <Route path="/dealership" element={<Suspense fallback={<LoadingSpinner />}><DealershipPage /></Suspense>} />
          <Route path="/delarship" element={<Suspense fallback={<LoadingSpinner />}><DealershipPage /></Suspense>} />
          <Route path="*" element={<HomePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
