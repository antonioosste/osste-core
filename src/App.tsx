import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { GrainLayer } from "@/components/ui/grain-layer";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ApprovedRoute } from "@/components/auth/ApprovedRoute";
import { useApproval } from "@/hooks/useApproval";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { InstallPrompt } from "@/components/mobile/InstallPrompt";

// Critical (eager): Landing, Login, Signup — first paint paths
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";

// Non-critical: lazy-loaded
const Waitlist = lazy(() => import("./pages/Waitlist"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Session = lazy(() => import("./pages/Session"));
const SessionComplete = lazy(() => import("./pages/SessionComplete"));
const Books = lazy(() => import("./pages/Books"));
const BookDetail = lazy(() => import("./pages/BookDetail"));
const Stories = lazy(() => import("./pages/Stories"));
const StoryDetail = lazy(() => import("./pages/StoryDetail"));
const BookPreview = lazy(() => import("./pages/BookPreview"));
const Checkout = lazy(() => import("./pages/Checkout"));
const CheckoutSuccess = lazy(() => import("./pages/CheckoutSuccess"));
const CheckoutCancel = lazy(() => import("./pages/CheckoutCancel"));
const Settings = lazy(() => import("./pages/Settings"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminSessions = lazy(() => import("./pages/admin/AdminSessions"));
const AdminStories = lazy(() => import("./pages/admin/AdminStories"));
const AdminPayments = lazy(() => import("./pages/admin/AdminPayments"));
const AdminAnalytics = lazy(() => import("./pages/admin/AdminAnalytics"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const AdminAuditLog = lazy(() => import("./pages/admin/AdminAuditLog"));
const AdminQuestions = lazy(() => import("./pages/AdminQuestions"));
const AdminPrintOrders = lazy(() => import("./pages/AdminPrintOrders"));
const AdminPlans = lazy(() => import("./pages/admin/AdminPlans"));
const QuestionBankImport = lazy(() => import("./pages/QuestionBankImport"));
const QuestionImport = lazy(() => import("./pages/QuestionImport"));
const Interview = lazy(() => import("./pages/Interview"));
const ChapterDetail = lazy(() => import("./pages/ChapterDetail"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Cookies = lazy(() => import("./pages/Cookies"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Help = lazy(() => import("./pages/Help"));
const PrintRequest = lazy(() => import("./pages/PrintRequest"));
const PrintSuccess = lazy(() => import("./pages/PrintSuccess"));
const GiftFlow = lazy(() => import("./pages/GiftFlow"));
const GiftConfirmation = lazy(() => import("./pages/GiftConfirmation"));
const RedeemGift = lazy(() => import("./pages/RedeemGift"));
const TestEmail = lazy(() => import("./pages/TestEmail"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const PendingApproval = lazy(() => import("./pages/PendingApproval"));
const BetaExpired = lazy(() => import("./pages/BetaExpired"));
const MobileHome = lazy(() => import("@/components/mobile/MobileHome").then(m => ({ default: m.MobileHome })));
const MobileSessions = lazy(() => import("@/components/mobile/MobileSessions").then(m => ({ default: m.MobileSessions })));
const MobileStories = lazy(() => import("@/components/mobile/MobileStories").then(m => ({ default: m.MobileStories })));
const MobileProfile = lazy(() => import("@/components/mobile/MobileProfile").then(m => ({ default: m.MobileProfile })));

const queryClient = new QueryClient();

// Lightweight loading fallback with subtle spinner (avoids appearing as a blank page)
const RouteFallback = () => (
  <div
    role="status"
    aria-label="Loading"
    style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "hsl(var(--background))" }}
  >
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
  </div>
);

// Redirect authenticated+approved users away from auth pages to dashboard
function RedirectIfApproved({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { approved, loading: approvalLoading } = useApproval();

  if (authLoading || approvalLoading) return <>{children}</>;
  if (user && approved) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <GrainLayer />
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <InstallPrompt />
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/" element={<RedirectIfApproved><Landing /></RedirectIfApproved>} />
              <Route path="/waitlist" element={<Waitlist />} />
              <Route path="/home" element={<Navigate to="/" replace />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/login" element={<RedirectIfApproved><Login /></RedirectIfApproved>} />
              <Route path="/signup" element={<RedirectIfApproved><Signup /></RedirectIfApproved>} />
              <Route path="/dashboard" element={<ApprovedRoute><DashboardLayout mobileContent={<MobileHome />}><Dashboard /></DashboardLayout></ApprovedRoute>} />
              <Route path="/session" element={<ApprovedRoute><Session /></ApprovedRoute>} />
              <Route path="/session/complete" element={<ApprovedRoute><SessionComplete /></ApprovedRoute>} />
              <Route path="/books" element={<ApprovedRoute><DashboardLayout mobileContent={<MobileSessions />}><Books /></DashboardLayout></ApprovedRoute>} />
              <Route path="/books/:id" element={<ApprovedRoute><BookDetail /></ApprovedRoute>} />
              <Route path="/stories" element={<ApprovedRoute><DashboardLayout mobileContent={<MobileStories />}><Stories /></DashboardLayout></ApprovedRoute>} />
              <Route path="/stories/:id" element={<ApprovedRoute><StoryDetail /></ApprovedRoute>} />
              <Route path="/chapters/:id" element={<ApprovedRoute><ChapterDetail /></ApprovedRoute>} />
              <Route path="/book/preview/:storyId" element={<ApprovedRoute><BookPreview /></ApprovedRoute>} />
              <Route path="/checkout" element={<ApprovedRoute><Checkout /></ApprovedRoute>} />
              <Route path="/checkout/success" element={<ApprovedRoute><CheckoutSuccess /></ApprovedRoute>} />
              <Route path="/checkout/cancel" element={<ApprovedRoute><CheckoutCancel /></ApprovedRoute>} />
              <Route path="/settings" element={<ApprovedRoute><DashboardLayout mobileContent={<MobileProfile />}><Settings /></DashboardLayout></ApprovedRoute>} />

              {/* Admin routes with dedicated admin layout */}
              <Route path="/admin" element={<ProtectedRoute><AdminLayout><AdminDashboard /></AdminLayout></ProtectedRoute>} />
              <Route path="/admin/users" element={<ProtectedRoute><AdminLayout><AdminUsers /></AdminLayout></ProtectedRoute>} />
              <Route path="/admin/sessions" element={<ProtectedRoute><AdminLayout><AdminSessions /></AdminLayout></ProtectedRoute>} />
              <Route path="/admin/stories" element={<ProtectedRoute><AdminLayout><AdminStories /></AdminLayout></ProtectedRoute>} />
              <Route path="/admin/payments" element={<ProtectedRoute><AdminLayout requirePermission="canManagePayments"><AdminPayments /></AdminLayout></ProtectedRoute>} />
              <Route path="/admin/analytics" element={<ProtectedRoute><AdminLayout><AdminAnalytics /></AdminLayout></ProtectedRoute>} />
              <Route path="/admin/settings" element={<ProtectedRoute><AdminLayout requirePermission="canManageSettings"><AdminSettings /></AdminLayout></ProtectedRoute>} />
              <Route path="/admin/audit" element={<ProtectedRoute><AdminLayout requirePermission="canViewAuditLog"><AdminAuditLog /></AdminLayout></ProtectedRoute>} />
              <Route path="/admin/print-orders" element={<ProtectedRoute><AdminLayout><AdminPrintOrders /></AdminLayout></ProtectedRoute>} />
              <Route path="/admin/plans" element={<ProtectedRoute><AdminLayout requirePermission="canManagePlans"><AdminPlans /></AdminLayout></ProtectedRoute>} />
              <Route path="/admin/questions" element={<ProtectedRoute><AdminLayout><AdminQuestions /></AdminLayout></ProtectedRoute>} />
              <Route path="/admin/import-questions" element={<ProtectedRoute><AdminLayout><QuestionBankImport /></AdminLayout></ProtectedRoute>} />
              <Route path="/admin/question-import" element={<ProtectedRoute><AdminLayout><QuestionImport /></AdminLayout></ProtectedRoute>} />

              <Route path="/interview" element={<ApprovedRoute><Interview /></ApprovedRoute>} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/pending-approval" element={<ProtectedRoute><PendingApproval /></ProtectedRoute>} />
              <Route path="/beta-expired" element={<ProtectedRoute><BetaExpired /></ProtectedRoute>} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/cookies" element={<Cookies />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/help" element={<Help />} />
              <Route path="/print-request" element={<ApprovedRoute><DashboardLayout><PrintRequest /></DashboardLayout></ApprovedRoute>} />
              <Route path="/print-success" element={<ApprovedRoute><DashboardLayout><PrintSuccess /></DashboardLayout></ApprovedRoute>} />
              <Route path="/gift" element={<GiftFlow />} />
              <Route path="/gift/confirmation" element={<GiftConfirmation />} />
              <Route path="/redeem/:gift_id" element={<RedeemGift />} />
              <Route path="/test-email" element={<ProtectedRoute><TestEmail /></ProtectedRoute>} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
