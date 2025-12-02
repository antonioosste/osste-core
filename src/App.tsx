import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { GrainLayer } from "@/components/ui/grain-layer";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
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
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Cookies from "./pages/Cookies";
import FAQ from "./pages/FAQ";
import Help from "./pages/Help";
import NotFound from "./pages/NotFound";
import PrintRequest from "./pages/PrintRequest";
import PrintSuccess from "./pages/PrintSuccess";

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
            <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout><Dashboard /></DashboardLayout></ProtectedRoute>} />
            <Route path="/session" element={<ProtectedRoute><Session /></ProtectedRoute>} />
            <Route path="/books" element={<ProtectedRoute><DashboardLayout><Books /></DashboardLayout></ProtectedRoute>} />
            <Route path="/books/:id" element={<ProtectedRoute><BookDetail /></ProtectedRoute>} />
            <Route path="/stories" element={<ProtectedRoute><DashboardLayout><Stories /></DashboardLayout></ProtectedRoute>} />
            <Route path="/stories/:id" element={<ProtectedRoute><StoryDetail /></ProtectedRoute>} />
            <Route path="/book/preview" element={<ProtectedRoute><BookPreview /></ProtectedRoute>} />
            <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
            <Route path="/checkout/success" element={<ProtectedRoute><CheckoutSuccess /></ProtectedRoute>} />
            <Route path="/checkout/cancel" element={<ProtectedRoute><CheckoutCancel /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><DashboardLayout><Settings /></DashboardLayout></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
            <Route path="/admin/questions" element={<ProtectedRoute><AdminQuestions /></ProtectedRoute>} />
            <Route path="/admin/import-questions" element={<ProtectedRoute><QuestionBankImport /></ProtectedRoute>} />
            <Route path="/admin/question-import" element={<ProtectedRoute><QuestionImport /></ProtectedRoute>} />
            <Route path="/interview" element={<ProtectedRoute><Interview /></ProtectedRoute>} />
            <Route path="/terms" element={<WaitlistGuard><Terms /></WaitlistGuard>} />
            <Route path="/privacy" element={<WaitlistGuard><Privacy /></WaitlistGuard>} />
            <Route path="/cookies" element={<WaitlistGuard><Cookies /></WaitlistGuard>} />
            <Route path="/faq" element={<WaitlistGuard><FAQ /></WaitlistGuard>} />
            <Route path="/help" element={<WaitlistGuard><Help /></WaitlistGuard>} />
            <Route path="/print-request" element={<ProtectedRoute><DashboardLayout><PrintRequest /></DashboardLayout></ProtectedRoute>} />
            <Route path="/print-success" element={<ProtectedRoute><DashboardLayout><PrintSuccess /></DashboardLayout></ProtectedRoute>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
