import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { IncomingCallProvider } from "@/components/call/IncomingCallProvider";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AdminRoute from "@/components/admin/AdminRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Marketplace from "./pages/Marketplace";
import CreateService from "./pages/CreateService";
import Feed from "./pages/Feed";
import Chat from "./pages/Chat";
import Wallet from "./pages/Wallet";
import EditProfile from "./pages/EditProfile";
import CallSession from "./pages/CallSession";
import CallHistory from "./pages/CallHistory";
import UserProfile from "./pages/UserProfile";
import AdminOverview from "./pages/admin/AdminOverview";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminContent from "./pages/admin/AdminContent";
import AdminServices from "./pages/admin/AdminServices";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminPayments from "./pages/admin/AdminPayments";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminRecordings from "./pages/admin/AdminRecordings";
import AdminDisputes from "./pages/admin/AdminDisputes";
import AdminAds from "./pages/admin/AdminAds";
import CreateAd from "./pages/CreateAd";
import Rewards from "./pages/Rewards";
import Reels from "./pages/Reels";
import Groups from "./pages/Groups";
import CreateGroup from "./pages/CreateGroup";
import GroupDetail from "./pages/GroupDetail";
import Pages from "./pages/Pages";
import CreatePage from "./pages/CreatePage";
import PageDetail from "./pages/PageDetail";
import Discover from "./pages/Discover";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <IncomingCallProvider>
          <Routes>
            <Route path="/" element={<Feed />} />
            <Route path="/login" element={<Login />} />
            <Route path="/feed" element={<Feed />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/signup" element={<Signup />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/create-service"
              element={
                <ProtectedRoute>
                  <CreateService />
                </ProtectedRoute>
              }
            />
            <Route
              path="/rewards"
              element={
                <ProtectedRoute>
                  <Rewards />
                </ProtectedRoute>
              }
            />
            <Route
              path="/create-ad"
              element={
                <ProtectedRoute>
                  <CreateAd />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chat"
              element={
                <ProtectedRoute>
                  <Chat />
                </ProtectedRoute>
              }
            />
            <Route
              path="/wallet"
              element={
                <ProtectedRoute>
                  <Wallet />
                </ProtectedRoute>
              }
            />
            <Route
              path="/edit-profile"
              element={
                <ProtectedRoute>
                  <EditProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/call"
              element={
                <ProtectedRoute>
                  <CallSession />
                </ProtectedRoute>
              }
            />
            <Route
              path="/call-history"
              element={
                <ProtectedRoute>
                  <CallHistory />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reels"
              element={
                <ProtectedRoute>
                  <Reels />
                </ProtectedRoute>
              }
            />
            <Route path="/profile/:userId" element={<UserProfile />} />
            <Route path="/groups" element={<Groups />} />
            <Route path="/groups/:groupId" element={<GroupDetail />} />
            <Route path="/create-group" element={<ProtectedRoute><CreateGroup /></ProtectedRoute>} />
            <Route path="/pages" element={<Pages />} />
            <Route path="/pages/:pageId" element={<PageDetail />} />
            <Route path="/create-page" element={<ProtectedRoute><CreatePage /></ProtectedRoute>} />
            <Route path="/discover" element={<Discover />} />
            <Route path="/admin" element={<AdminRoute><AdminOverview /></AdminRoute>} />
            <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
            <Route path="/admin/content" element={<AdminRoute><AdminContent /></AdminRoute>} />
            <Route path="/admin/services" element={<AdminRoute><AdminServices /></AdminRoute>} />
            <Route path="/admin/analytics" element={<AdminRoute><AdminAnalytics /></AdminRoute>} />
            <Route path="/admin/payments" element={<AdminRoute><AdminPayments /></AdminRoute>} />
            <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />
            <Route path="/admin/recordings" element={<AdminRoute><AdminRecordings /></AdminRoute>} />
            <Route path="/admin/disputes" element={<AdminRoute><AdminDisputes /></AdminRoute>} />
            <Route path="/admin/ads" element={<AdminRoute><AdminAds /></AdminRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </IncomingCallProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
