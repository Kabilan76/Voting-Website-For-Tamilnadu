
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import NavBar from "./components/NavBar";
import { AuthProvider } from "./contexts/AuthContext";
import { ElectionProvider } from "./contexts/ElectionContext";

// Pages
import Login from "./pages/Login";
import VotingPage from "./pages/VotingPage";
import ResultsPage from "./pages/ResultsPage";
import CandidatesPage from "./pages/admin/CandidatesPage";
import ResultsManagementPage from "./pages/admin/ResultsManagementPage";
import SettingsPage from "./pages/admin/SettingsPage";
import NotFound from "./pages/NotFound";
import Index from "./pages/Index";
import PublicResultsPage from "./pages/PublicResultsPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <ElectionProvider>
          <BrowserRouter>
            <div className="min-h-screen bg-gray-50 flex flex-col">
              <NavBar />
              
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/vote" element={<VotingPage />} />
                <Route path="/results" element={<ResultsPage />} />
                <Route path="/public-results" element={<PublicResultsPage />} />
                
                {/* Admin routes */}
                <Route path="/admin/candidates" element={<CandidatesPage />} />
                <Route path="/admin/results" element={<ResultsManagementPage />} />
                <Route path="/admin/settings" element={<SettingsPage />} />
                
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
          </BrowserRouter>
        </ElectionProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
