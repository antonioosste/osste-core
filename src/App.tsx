import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { GrainLayer } from "@/components/ui/grain-layer";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ApprovedRoute } from "@/components/auth/ApprovedRoute";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import Waitlist from "./pages/Waitlist";
import Landing from "./pages/Landing";
import Pricing from "./pages/Pricing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Session from "./pages/Session";
import Books from "./pages/Books";
import BookDetail from "./pages/BookDetail";
import Stories from "./pages/Stories";
import StoryDetail from "./pages/StoryDetail";
import BookPreview from "./pages/BookPreview";
import Checkout from "./pages/Checkout";
import CheckoutSuccess from "./pages/CheckoutSuccess";
import CheckoutCancel from "./pages/CheckoutCancel";
import Settings from "./pages/Settings";
import Admin from "./pages/Admin";
import AdminQuestions from "./pages/AdminQuestions";
import QuestionBankImport from "./pages/QuestionBankImport";
import QuestionImport from "./pages/QuestionImport";
import Interview from "./pages/Interview";
import ChapterDetail from "./pages/ChapterDetail";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Cookies from "./pages/Cookies";
import FAQ from "./pages/FAQ";
import Help from "./pages/Help";
import NotFound from "./pages/NotFound";
import PrintRequest from "./pages/PrintRequest";
import PrintSuccess from "./pages/PrintSuccess";
import GiftFlow from "./pages/GiftFlow";
import GiftConfirmation from "./pages/GiftConfirmation";
import TestEmail from "./pages/TestEmail";

const queryClient = new QueryClient();

// Production-only waitlist lock: redirects non-authenticated users to waitlist
function WaitlistGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  
  // Check if we're in production (not Lovable preview or local dev)
  const isProduction = !window.location.hostname.includes('lovable') && 
                       !window.location.hostname.includes('localhost');
  
  // Allow access if: not in production, user is authenticated, or already on waitlist
  if (!isProduction || loading || user || location.pathname === '/') {
    return <>{children}</>;
  }
  
  // In production, redirect non-authenticated users to waitlist
  return <Navigate to="/" replace />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <GrainLayer />
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Waitlist />} />
            <Route path="/home" element={<WaitlistGuard><Landing /></WaitlistGuard>} />
            <Route path="/pricing" element={<WaitlistGuard><Pricing /></WaitlistGuard>} />
            <Route path="/login" element={<WaitlistGuard><Login /></WaitlistGuard>} />
            <Route path="/signup" element={<WaitlistGuard><Signup /></WaitlistGuard>} />
            <Route path="/dashboard" element={<ApprovedRoute><DashboardLayout><Dashboard /></DashboardLayout></ApprovedRoute>} />
            <Route path="/session" element={<ApprovedRoute><Session /></ApprovedRoute>} />
            <Route path="/books" element={<ApprovedRoute><DashboardLayout><Books /></DashboardLayout></ApprovedRoute>} />
            <Route path="/books/:id" element={<ApprovedRoute><BookDetail /></ApprovedRoute>} />
            <Route path="/stories" element={<ApprovedRoute><DashboardLayout><Stories /></DashboardLayout></ApprovedRoute>} />
            <Route path="/stories/:id" element={<ApprovedRoute><StoryDetail /></ApprovedRoute>} />
            <Route path="/chapters/:id" element={<ApprovedRoute><ChapterDetail /></ApprovedRoute>} />
            <Route path="/book/preview/:storyId" element={<ApprovedRoute><BookPreview /></ApprovedRoute>} />
            <Route path="/checkout" element={<ApprovedRoute><Checkout /></ApprovedRoute>} />
            <Route path="/checkout/success" element={<ApprovedRoute><CheckoutSuccess /></ApprovedRoute>} />
            <Route path="/checkout/cancel" element={<ApprovedRoute><CheckoutCancel /></ApprovedRoute>} />
            <Route path="/settings" element={<ApprovedRoute><DashboardLayout><Settings /></DashboardLayout></ApprovedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
            <Route path="/admin/questions" element={<ProtectedRoute><AdminQuestions /></ProtectedRoute>} />
            <Route path="/admin/import-questions" element={<ProtectedRoute><QuestionBankImport /></ProtectedRoute>} />
            <Route path="/admin/question-import" element={<ProtectedRoute><QuestionImport /></ProtectedRoute>} />
            <Route path="/interview" element={<ApprovedRoute><Interview /></ApprovedRoute>} />
            <Route path="/terms" element={<WaitlistGuard><Terms /></WaitlistGuard>} />
            <Route path="/privacy" element={<WaitlistGuard><Privacy /></WaitlistGuard>} />
            <Route path="/cookies" element={<WaitlistGuard><Cookies /></WaitlistGuard>} />
            <Route path="/faq" element={<WaitlistGuard><FAQ /></WaitlistGuard>} />
            <Route path="/help" element={<WaitlistGuard><Help /></WaitlistGuard>} />
            <Route path="/print-request" element={<ApprovedRoute><DashboardLayout><PrintRequest /></DashboardLayout></ApprovedRoute>} />
            <Route path="/print-success" element={<ApprovedRoute><DashboardLayout><PrintSuccess /></DashboardLayout></ApprovedRoute>} />
            <Route path="/gift" element={<WaitlistGuard><GiftFlow /></WaitlistGuard>} />
            <Route path="/gift/confirmation" element={<WaitlistGuard><GiftConfirmation /></WaitlistGuard>} />
            <Route path="/test-email" element={<ProtectedRoute><TestEmail /></ProtectedRoute>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
