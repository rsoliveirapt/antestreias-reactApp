import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Outlet, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import { API_BASE } from './config';
import Home from './pages/Home';
import Register from './pages/Register';
import Movie from './pages/Movie';
import MovieCast from './pages/MovieCast';
import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminMedia from './pages/admin/Media';
import AdminMediaEdit from './pages/admin/MediaEdit';
import AdminCelebrities from './pages/admin/Celebrities';
import AdminCelebrityEdit from './pages/admin/CelebrityEdit';
import SettingsLayout from './pages/admin/settings/SettingsLayout';
import SettingsSearch from './pages/admin/settings/Search';
import SettingsContent from './pages/admin/settings/Content';
import SettingsVideos from './pages/admin/settings/Videos';
import SettingsGeneral from './pages/admin/settings/General';
import SettingsLocalization from './pages/admin/settings/Localization';
import SettingsRegistration from './pages/admin/settings/Registration';
import SettingsAuth from './pages/admin/settings/Auth';
import SettingsUploads from './pages/admin/settings/Uploads';
import SettingsMail from './pages/admin/settings/Mail';
import SettingsCache from './pages/admin/settings/Cache';
import SettingsMetrics from './pages/admin/settings/Metrics';
import SettingsLogging from './pages/admin/settings/Logging';
import SettingsQueue from './pages/admin/settings/Queue';
import SettingsRecaptcha from './pages/admin/settings/Recaptcha';
import SettingsGdpr from './pages/admin/settings/Gdpr';
import SettingsSEO from './pages/admin/settings/SEO';
import SettingsThemes from './pages/admin/settings/Themes';
import SettingsAppearance from './pages/admin/settings/Appearance';
import SettingsAppearanceSlider from './pages/admin/settings/AppearanceSlider';
import SettingsAppearanceMail from './pages/admin/settings/AppearanceMail';
import SettingsMailTemplates from './pages/admin/settings/MailTemplates';
import SettingsRoles from './pages/admin/settings/Roles';
import SettingsFooter from './pages/admin/settings/Footer';
import AdminMenus from './pages/admin/Menus';
import AdminTranslations from './pages/admin/Translations';
import AdminTranslationEdit from './pages/admin/TranslationEdit';
import AdminCategories from './pages/admin/Categories';
import AdminReviews from './pages/admin/Reviews';
import AdminPages from './pages/admin/Pages';
import AdminPageEditor from './pages/admin/PageEditor';
import AdminNews from './pages/admin/News';
import AdminNewsSources from './pages/admin/NewsSources';
import AdminVideos from './pages/admin/Videos';
import AdminFiles from './pages/admin/Files';
import AdminAds from './pages/admin/Ads';
import AdminContests from './pages/admin/Contests';
import AdminGoogleAlerts from './pages/admin/GoogleAlerts';
import AdminPushNotifications from './pages/admin/PushNotifications';
import News from './pages/News';
import NewsDetail from './pages/NewsDetail';
import Category from './pages/Category';
import Reviews from './pages/Reviews';
import ReviewDetail from './pages/ReviewDetail';
import Contests from './pages/Contests';
import Login from './pages/Login';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Movies from './pages/Movies';
import Series from './pages/Series';
import Profile from './pages/Profile';
import AccountSettings from './pages/AccountSettings';
import CustomPage from './pages/CustomPage';
import Celebrity from './pages/Celebrity';
import Contact from './pages/Contact';
import ProtectedRoute from './components/ProtectedRoute';
import ThemeProvider from './components/ThemeProvider';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider, useTranslation } from './context/LanguageContext';
import Toast from './components/Toast';
import CookieBanner from './components/CookieBanner';
import PwaInstallBanner from './components/PwaInstallBanner';
import ScrollToTop from './components/ScrollToTop';
import './index.css';


import Footer from './components/Footer';

function MainLayout() {
  const location = useLocation();
  const { t } = useTranslation();

  useEffect(() => {
    const updateTitle = () => {
      const siteName = localStorage.getItem('site_name') || 'Antestreias';
      
      // Map static routes to suffixes
      const routeTitles: Record<string, string> = {
        '/': '',
        '/movies': t('nav_movies', 'Filmes'),
        '/series': t('nav_series', 'Séries'),
        '/reviews': t('reviews_title', 'Críticas'),
        '/contests': t('contests_title', 'Passatempos'),
        '/news': t('news_title', 'Notícias'),
        '/login': t('auth_login_title', 'Iniciar Sessão'),
        '/register': t('auth_register_title', 'Criar Conta'),
        '/forgot-password': t('auth_forgot_title', 'Recuperar Palavra-passe'),
        '/reset-password': t('auth_reset_title', 'Nova Palavra-passe'),
        '/definicoes': t('settings_title', 'Definições'),
        '/contact': t('contact_title', 'Contactos'),
      };

      const path = location.pathname;
      
      // Only set title if it's a static route we match exactly or starts with profile/settings
      if (routeTitles[path] !== undefined) {
        const suffix = routeTitles[path];
        document.title = suffix ? `${siteName} - ${suffix}` : siteName;
      } else if (path.startsWith('/perfil')) {
        document.title = `${siteName} - ${t('nav_profile', 'Perfil')}`;
      }
    };

    updateTitle();

    window.addEventListener('site_name_updated', updateTitle);
    return () => {
      window.removeEventListener('site_name_updated', updateTitle);
    };
  }, [location.pathname, t]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <div style={{ flex: 1 }}>
        <Outlet />
      </div>
      <Footer />
    </div>
  );
}

function App() {
  useEffect(() => {
    fetch(`${API_BASE}/admin_appearance.php`, {
      credentials: 'include'
    })
      .then(res => res.json())
      .then(data => {
        if (data['general.site_name']) {
          localStorage.setItem('site_name', data['general.site_name']);
          window.dispatchEvent(new Event('site_name_updated'));
        }
        if (data['appearance.favicon']) {
          const favicon = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
          if (favicon) favicon.href = data['appearance.favicon'];
        }
      });
  }, []);

  return (
    <AuthProvider>
      <LanguageProvider>
        <ThemeProvider>
          <Toast />
          <BrowserRouter>
            <CookieBanner />
            <PwaInstallBanner />
          <ScrollToTop />
          <Routes>
            <Route element={<MainLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/movies" element={<Movies />} />
              <Route path="/series" element={<Series />} />
              <Route path="/reviews" element={<Reviews />} />
              <Route path="/contests" element={<Contests />} />
              <Route path="/review/:slug" element={<ReviewDetail />} />
              <Route path="/movie/:id" element={<Movie />} />
              <Route path="/movie/:id/cast" element={<MovieCast />} />
              <Route path="/category/:slug" element={<Category />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/series/:id" element={<Movie />} />
              <Route path="/titles/:id" element={<Movie />} />
              <Route path="/news" element={<News />} />
              <Route path="/news/:slug" element={<NewsDetail />} />
              <Route path="/perfil" element={<Profile />} />
              <Route path="/perfil/:username" element={<Profile />} />
              <Route path="/definicoes" element={<AccountSettings />} />
              <Route path="/celebrity/:slug" element={<Celebrity />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/:slug" element={<CustomPage />} />
            </Route>

            <Route element={<ProtectedRoute requiredPermission="access_admin" />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="movies" element={<AdminMedia />} />
                <Route path="movies/:id" element={<AdminMediaEdit />} />
                <Route path="series" element={<AdminMedia />} />
                <Route path="series/:id" element={<AdminMediaEdit />} />
                <Route path="celebrities" element={<AdminCelebrities />} />
                <Route path="celebrities/:id" element={<AdminCelebrityEdit />} />
                <Route path="translations" element={<AdminTranslations />} />
                <Route path="translations/:id" element={<AdminTranslationEdit />} />
                <Route path="categories" element={<AdminCategories />} />
                <Route path="reviews" element={<AdminReviews />} />
                <Route path="news" element={<AdminNews />} />
                <Route path="news/sources" element={<AdminNewsSources />} />
                <Route path="videos" element={<AdminVideos />} />
                <Route path="files" element={<AdminFiles />} />
                <Route path="ads" element={<AdminAds />} />
                <Route path="alerts" element={<AdminGoogleAlerts />} />
                <Route path="notifications" element={<AdminPushNotifications />} />
                <Route path="pages" element={<AdminPages />} />
                <Route path="pages/new" element={<AdminPageEditor />} />
                <Route path="pages/:id" element={<AdminPageEditor />} />
                <Route path="contests" element={<AdminContests />} />

                <Route path="settings" element={<SettingsLayout />}>
                  <Route index element={<SettingsSearch />} />
                  <Route path="search" element={<SettingsSearch />} />
                  <Route path="content" element={<SettingsContent />} />
                  <Route path="videos" element={<SettingsVideos />} />
                  <Route path="general" element={<SettingsGeneral />} />
                  <Route path="registration" element={<SettingsRegistration />} />
                  <Route path="localization" element={<SettingsLocalization />} />
                  <Route path="auth" element={<SettingsAuth />} />
                  <Route path="uploads" element={<SettingsUploads />} />
                  <Route path="mail" element={<SettingsMail />} />
                  <Route path="cache" element={<SettingsCache />} />
                  <Route path="metrics" element={<SettingsMetrics />} />
                  <Route path="logging" element={<SettingsLogging />} />
                  <Route path="queue" element={<SettingsQueue />} />
                  <Route path="recaptcha" element={<SettingsRecaptcha />} />
                  <Route path="gdpr" element={<SettingsGdpr />} />
                  <Route path="seo" element={<SettingsSEO />} />
                  <Route path="themes" element={<SettingsThemes />} />
                  <Route path="appearance" element={<SettingsAppearance />} />
                  <Route path="appearance/slider" element={<SettingsAppearanceSlider />} />
                  <Route path="appearance/mail" element={<SettingsAppearanceMail />} />
                  <Route path="appearance/mail/templates" element={<SettingsMailTemplates />} />
                   <Route path="roles" element={<SettingsRoles />} />
                  <Route path="footer" element={<SettingsFooter />} />
                  <Route path="menus" element={<AdminMenus />} />
                </Route>
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;
