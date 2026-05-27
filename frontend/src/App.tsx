import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { lazy, Suspense } from "react";
import { Route, Switch, useLocation, Redirect } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";
import { ClerkProvider } from "@clerk/clerk-react";
import { Loader2 } from "lucide-react";
import ScrollToTop from "./components/ScrollToTop";

// Lazy load pages for performance
const Home = lazy(() => import("@/pages/Home"));
const MarketplaceResponsive = lazy(() => import("@/pages/MarketplaceResponsive").then(module => ({ default: module.MarketplaceResponsive })));
const AuctionResponsive = lazy(() => import("@/pages/AuctionResponsive").then(module => ({ default: module.AuctionResponsive })));
const RentalResponsive = lazy(() => import("@/pages/RentalResponsive").then(module => ({ default: module.RentalResponsive })));
const Profile = lazy(() => import("@/pages/Profile"));
const PublicProfile = lazy(() => import("@/pages/PublicProfile"));
const Messages = lazy(() => import("@/pages/Messages"));
const AdminDashboard = lazy(() => import("@/pages/AdminDashboard"));
const About = lazy(() => import("@/pages/About"));
const Help = lazy(() => import("@/pages/Help"));
const Categories = lazy(() => import("@/pages/Categories"));
const ListingDetail = lazy(() => import("@/pages/ListingDetail"));
const SellerDashboard = lazy(() => import("@/pages/SellerDashboard"));
const BuyerDashboard = lazy(() => import("@/pages/BuyerDashboard"));
const SuperAdminDashboard = lazy(() => import("@/pages/SuperAdminDashboard"));
const AdminAdDashboard = lazy(() => import("@/pages/AdminAdDashboard"));
const Login = lazy(() => import("@/pages/Login"));
const Register = lazy(() => import("@/pages/Register"));
const ForgotPassword = lazy(() => import("@/pages/ForgotPassword"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
const PostListing = lazy(() => import("@/pages/PostListing"));
const EditListing = lazy(() => import("@/pages/EditListing"));
const AuctionDetail = lazy(() => import("@/pages/AuctionDetail"));
const RentalDetail = lazy(() => import("@/pages/RentalDetail"));
const DealsAndOffersPage = lazy(() => import("@/pages/DealsAndOffersPage"));
const Verification = lazy(() => import("@/pages/Verification"));
const Checkout = lazy(() => import("@/pages/Checkout"));
const Cart = lazy(() => import("@/pages/Cart"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const Terms = lazy(() => import("@/pages/Terms"));
const Privacy = lazy(() => import("@/pages/Privacy"));
const Report = lazy(() => import("@/pages/Report"));
const Contact = lazy(() => import("@/pages/Contact"));
const SafetyTips = lazy(() => import("@/pages/SafetyTips"));
const Career = lazy(() => import("@/pages/Career"));
const PartnerDetail = lazy(() => import("@/pages/PartnerDetail"));
const WalletCheckout = lazy(() => import("@/pages/WalletCheckout"));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-8 h-8 animate-spin text-green-600" />
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route path="/forgot-password" component={ForgotPassword} />
        <Route path="/reset-password" component={ResetPassword} />
        <Route path="/" component={Home} />
        <Route path="/marketplace" component={MarketplaceResponsive} />
        <Route path="/auctions" component={AuctionResponsive} />
        <Route path="/auction/:id" component={AuctionDetail} />
        <Route path="/rentals" component={RentalResponsive} />
        <Route path="/rentals/:id" component={RentalDetail} />
        <Route path="/deals-and-offers" component={DealsAndOffersPage} />
        <Route path="/profile" component={Profile} />
        <Route path="/profile/:id" component={PublicProfile} />
        <Route path="/messages" component={Messages} />
        <Route path="/about" component={About} />
        <Route path="/help" component={Help} />
        <Route path="/categories" component={Categories} />
        <Route path="/listing/:id" component={ListingDetail} />
        <Route path="/post-listing" component={PostListing} />
        <Route path="/edit-listing/:id" component={EditListing} />
        <Route path="/verification" component={Verification} />
        <Route path="/checkout" component={Checkout} />
        <Route path="/cart" component={Cart} />
        <Route path="/terms" component={Terms} />
        <Route path="/privacy" component={Privacy} />
        <Route path="/report" component={Report} />
        <Route path="/contact" component={Contact} />
        <Route path="/safety-tips" component={SafetyTips} />
        <Route path="/career" component={Career} />
        <Route path="/partners/:partnerId" component={PartnerDetail} />
        <Route path="/seller/dashboard" component={SellerDashboard} />
        <Route path="/buyer/dashboard" component={BuyerDashboard} />
        <Route path="/admin/dashboard" component={AdminDashboard} />
        <Route path="/admin/ads" component={AdminAdDashboard} />
        <Route path="/super-admin/dashboard" component={SuperAdminDashboard} />
        <Route path="/wallet-checkout" component={WalletCheckout} />
        {/* Redirects for routes referenced elsewhere */}
        <Route path="/become-seller">
          <Redirect to="/verification" />
        </Route>
        <Route path="/seller-dashboard">
          <Redirect to="/seller/dashboard" />
        </Route>
        <Route path="/deal/:id">
          {(params: any) => <Redirect to={`/listing/${params.id}`} />}
        </Route>
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function AppContent() {
  const [location] = useLocation();
  const isMessagesPage = location === "/messages";
  const isAdminPage = location.startsWith("/admin") || location.startsWith("/super-admin");

  return (
    <div className="flex flex-col min-h-screen">
      <ScrollToTop />
      <Header />
      <main className="flex-1 pb-16 md:pb-0">
        <Router />
      </main>
      {!isMessagesPage && !isAdminPage && <Footer />}
      <BottomNav />
    </div>
  );
}

const AppInner = () => (
  <ThemeProvider defaultTheme="light">
    <TooltipProvider>
      <Toaster />
      <AppContent />
    </TooltipProvider>
  </ThemeProvider>
);

function App() {
  return (
    <ErrorBoundary>
      <AppInner />
    </ErrorBoundary>
  );
}

export default App;