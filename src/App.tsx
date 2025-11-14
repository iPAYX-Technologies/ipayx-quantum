import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { HelmetProvider } from "react-helmet-async";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CookieConsent from "@/components/CookieConsent";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PasswordGate } from "@/components/PasswordGate";
import Landing from "./pages/Landing";
import Demo from "./pages/Demo";
import Quote from "./pages/Quote";
import Keys from "./pages/Keys";
import Legal from "./pages/Legal";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Cookies from "./pages/Cookies";
import LegalFR from "./pages/LegalFR";
import PrivacyFR from "./pages/PrivacyFR";
import TermsFR from "./pages/TermsFR";
import NotFound from "./pages/NotFound";
import TestE2E from "./pages/TestE2E";
import Auth from "./pages/Auth";

import Admin from "./pages/Admin";
import AdminLeads from "./pages/AdminLeads";
import Pitch from "./pages/Pitch";
import Dashboard from "./pages/Dashboard";
import MetaRouter from "./pages/MetaRouter";
import Monitoring from "./pages/Monitoring";
import Agents from "./pages/Agents";
import UpdatePassword from "./pages/UpdatePassword";
import ResetPassword from "./pages/ResetPassword";
import Profile from "./pages/Profile";
import Enable2FA from "./pages/Enable2FA";
import FxMonitoring from "./pages/FxMonitoring";
import Blog from "./pages/Blog";
import Chains from "./pages/Chains";
import Marketing from "./pages/Marketing";
import AdminBulkCampaign from "./pages/AdminBulkCampaign";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCancel from "./pages/PaymentCancel";
import PerplexitySearch from "./pages/PerplexitySearch";
import Atlas from "./pages/Atlas";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} forcedTheme="dark">
        <TooltipProvider>
          <BrowserRouter>
            <AuthProvider>
              <LanguageProvider>
                  <Toaster />
                  <Sonner />
                  <CookieConsent />
                  <Navbar />
                  <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<Landing />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/demo" element={<Demo />} />
                  <Route path="/quote" element={<Quote />} />
                  <Route path="/payment/success" element={<PaymentSuccess />} />
                  <Route path="/payment/cancel" element={<PaymentCancel />} />
                  <Route path="/search" element={<PerplexitySearch />} />
                  <Route path="/legal" element={<Legal />} />
                  <Route path="/legal-fr" element={<LegalFR />} />
                  <Route path="/privacy" element={<Privacy />} />
                  <Route path="/privacy-fr" element={<PrivacyFR />} />
                  <Route path="/terms" element={<Terms />} />
                  <Route path="/terms-fr" element={<TermsFR />} />
                  <Route path="/cookies" element={<Cookies />} />
                  <Route path="/pitch" element={<Pitch />} />
                  <Route path="/monitoring" element={<Monitoring />} />
                  <Route path="/agents" element={<Agents />} />
                  <Route path="/blog/meta-router-explained" element={<Blog />} />
                  <Route path="/chains" element={<Chains />} />
                  <Route path="/atlas" element={<Atlas />} />
                  
                  {/* Protected Routes */}
                  <Route path="/keys" element={<ProtectedRoute><Keys /></ProtectedRoute>} />
                  <Route path="/admin" element={<ProtectedRoute requireAdmin={true}><Admin /></ProtectedRoute>} />
                  <Route path="/admin/leads" element={<ProtectedRoute requireAdmin={true}><AdminLeads /></ProtectedRoute>} />
                  <Route path="/admin/fx-monitoring" element={<ProtectedRoute requireAdmin={true}><FxMonitoring /></ProtectedRoute>} />
                  <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                  <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                  <Route path="/update-password" element={<ProtectedRoute><UpdatePassword /></ProtectedRoute>} />
                  <Route path="/enable-2fa" element={<ProtectedRoute><Enable2FA /></ProtectedRoute>} />
                  <Route path="/meta-router" element={<ProtectedRoute><MetaRouter /></ProtectedRoute>} />
                  <Route path="/test-e2e" element={<ProtectedRoute><TestE2E /></ProtectedRoute>} />
                  <Route path="/marketing" element={<ProtectedRoute requireAdmin={true}><Marketing /></ProtectedRoute>} />
                  <Route path="/admin/bulk-campaign" element={<ProtectedRoute requireAdmin={true}><AdminBulkCampaign /></ProtectedRoute>} />
                  
                  <Route path="*" element={<NotFound />} />
                </Routes>
                <Footer />
            </LanguageProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
    </HelmetProvider>
  </ErrorBoundary>
);

export default App;
