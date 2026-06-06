import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Menu, X, MessageSquare, User, ShieldCheck, ShieldAlert, ShoppingCart, Package } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState, useCallback, useEffect, useMemo } from "react";
import NotificationCenter from "@/components/NotificationCenter";
import { trpc } from "@/lib/trpc";
import { useWebSocket } from "@/hooks/useWebSocket";

// Static data
const popularSearches = ["Mobile Phones", "Laptops", "Bikes", "Apartments", "Furniture", "Books"];
const navItems = [
  { label: "Home", href: "/" },
  { label: "Marketplace", href: "/marketplace" },
  { label: "Auctions", href: "/auctions" },
  { label: "Rentals", href: "/rentals" },
  { label: "Deals", href: "/deals-and-offers" },
  { label: "About", href: "/about" },
  { label: "Help", href: "/help" },
];

// SearchBar Component
function SearchBar({ onSearch, onClose }: { onSearch?: (query: string) => void; onClose?: () => void }) {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [, navigate] = useLocation();
  const [location] = useLocation();

  // Sync input with URL search param
  useEffect(() => {
    const params = new URLSearchParams(location.split('?')[1]);
    const searchQuery = params.get('search') || '';
    setQuery(searchQuery);
  }, [location]);

  const handleSearch = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    // Get current path safely (without window)
    let currentPath = location.split('?')[0];
    if (currentPath === "/") {
      currentPath = "/marketplace";
    }
    // Allow search on relevant pages
    const validPaths = ["/marketplace", "/auctions", "/rentals", "/deals-and-offers"];
    if (!validPaths.includes(currentPath)) {
      currentPath = "/marketplace";
    }
    
    navigate(`${currentPath}?search=${encodeURIComponent(searchQuery)}`);
    onSearch?.(searchQuery);
    onClose?.();
  }, [navigate, onSearch, onClose, location]);

  return (
    <div className="relative w-full">
      <Input
        type="text"
        placeholder="Search..."
        className="w-full pl-9 pr-3 py-1.5 h-9 text-xs border-gray-200 rounded-full bg-gray-50 focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all shadow-sm"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setTimeout(() => setIsFocused(false), 200)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSearch(query);
        }}
      />
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
      {isFocused && !query && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-2">
          <p className="text-xs font-semibold text-gray-500 mb-2 px-2 uppercase tracking-wider">Popular Searches</p>
          <ul>
            {popularSearches.map((term) => (
              <li key={term}>
                <button
                  className="w-full text-left px-2 py-2 text-sm hover:bg-gray-100 rounded-md transition flex items-center gap-2"
                  onClick={() => {
                    setQuery(term);
                    handleSearch(term);
                  }}
                >
                  <Search className="w-3 h-3 text-gray-400" /> {term}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// Main Header Component
export default function Header() {
  const { user, logout, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Fetch notifications
  const { data: dbNotifications = [], refetch: refetchNotifications } = trpc.notifications.list.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 30000,
  });

  const markAsReadMutation = trpc.notifications.markAsRead.useMutation({
    onSuccess: () => refetchNotifications()
  });

  const markAllAsReadMutation = trpc.notifications.markAllAsRead.useMutation({
    onSuccess: () => refetchNotifications()
  });

  const deleteMutation = trpc.notifications.delete.useMutation({
    onSuccess: () => refetchNotifications()
  });

  // WebSocket for instant notification updates (fixed cleanup)
  const { onNewNotification, offNewNotification } = useWebSocket();

  useEffect(() => {
    if (!isAuthenticated) return;
    const unsubscribe = onNewNotification(() => {
      refetchNotifications();
    });
    return unsubscribe;
  }, [isAuthenticated, onNewNotification, refetchNotifications]);

  // Fetch cart
  const { data: cart } = trpc.cart.get.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const cartItemsCount = cart?.items?.reduce((acc: number, item: any) => acc + Number(item.quantity), 0) || 0;

  // Memoize formatted notifications
  const formattedNotifications = useMemo(() => 
    dbNotifications.map((n: any) => ({
      id: String(n.id),
      type: (n.type === "order_confirmation" || n.type === "product_sold" || n.type === "sale") ? "sale" : n.type,
      title: n.title,
      description: n.content || "",
      timestamp: new Date(n.createdAt),
      read: !!n.isRead,
    })),
    [dbNotifications]
  );

  // Close mobile menu on route change
  const [location] = useLocation();
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  // Handlers
  const handleLogout = useCallback(() => {
    logout();
    setMobileMenuOpen(false);
  }, [logout]);

  const allowedRoles = ["seller", "dealer", "wholesaler", "distributor", "admin", "super_admin"];
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";
  const isProfessional = allowedRoles.includes(user?.role || "");

  const handlePostAd = useCallback(() => {
    if (!isAuthenticated) {
      navigate("/login");
    } else if (!isProfessional) {
      navigate("/become-seller");
    } else if (!user?.isVerified && !isAdmin) {
      navigate("/verification");
    } else {
      navigate("/post-listing");
    }
    setMobileMenuOpen(false);
  }, [navigate, isAuthenticated, isProfessional, user, isAdmin]);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-1 text-xl sm:text-2xl font-bold text-green-600 hover:text-green-700 transition-colors">
            <span>Sasto</span>
          </Link>

          {/* Mobile Top Navigation (shrunk) */}
          <nav className="md:hidden flex items-center justify-center flex-1 mx-1 gap-1 sm:gap-2">
            {navItems.filter(item => !["About", "Help"].includes(item.label)).map((item) => {
              const isActive = location === item.href || (location.startsWith(item.href) && item.href !== "/");
              return (
                <Link 
                  key={item.label} 
                  href={item.href} 
                  className={`text-[9px] sm:text-xs font-bold px-1 py-1 rounded transition-colors whitespace-nowrap ${isActive ? "text-green-700" : "text-gray-600"}`}
                >
                  {item.label === "Marketplace" ? "Market" : item.label}
                </Link>
              );
            })}
          </nav>

          {/* Desktop Navigation — takes up remaining center space */}
          <nav className="hidden md:flex items-center gap-5 flex-1 mx-6">
            {navItems.map((item) => {
              const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`text-sm font-medium transition-colors whitespace-nowrap ${isActive ? "text-green-600" : "text-gray-700 hover:text-green-600"}`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Desktop Search */}
          <div className="hidden md:flex items-center w-[220px] xl:w-[280px] relative shrink-0">
            <SearchBar />
          </div>

          {/* Desktop Auth & Actions */}
          <div className="hidden md:flex items-center gap-2 shrink-0 ml-3">
            {isAuthenticated ? (
              <>
                {(user?.role === "super_admin" || user?.role === "admin") && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-red-200 text-red-600 hover:bg-red-50"
                    onClick={() => navigate("/super-admin/dashboard")}
                  >
                    Admin
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className={`${user?.isVerified ? "text-blue-600 hover:bg-blue-50" : "text-amber-600 hover:bg-amber-50"}`}
                  onClick={() => navigate("/verification")}
                  title={user?.isVerified ? "Verified Account" : "Unverified - Click to Verify"}
                  aria-label="Verification Status"
                >
                  {user?.isVerified ? <ShieldCheck className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-600 hover:text-green-600"
                  onClick={() => navigate("/messages")}
                  aria-label="Messages"
                >
                  <MessageSquare className="w-5 h-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-600 hover:text-green-600 relative"
                  onClick={() => navigate("/cart")}
                  aria-label="Cart"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {cartItemsCount > 0 && (
                    <span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                      {cartItemsCount}
                    </span>
                  )}
                </Button>
                <NotificationCenter
                  notifications={formattedNotifications}
                  onMarkAsRead={(id) => markAsReadMutation.mutate(Number(id))}
                  onMarkAllAsRead={() => markAllAsReadMutation.mutate()}
                  onDelete={(id) => deleteMutation.mutate(Number(id))}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-600 hover:text-green-600"
                  onClick={() => navigate("/profile")}
                  aria-label="Profile"
                >
                  <User className="w-5 h-5" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="text-gray-700 border-gray-300 hover:border-red-300 hover:text-red-600"
                >
                  Logout
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="text-gray-700 border-gray-300 hover:border-green-500 hover:text-green-600"
                onClick={() => navigate("/login")}
              >
                Login
              </Button>
            )}
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white shadow-sm"
              onClick={handlePostAd}
            >
              Post Ad
            </Button>
          </div>

          {/* Mobile Right Section */}
          <div className="md:hidden flex items-center gap-1">
            {isAuthenticated && (
              <NotificationCenter
                notifications={formattedNotifications}
                onMarkAsRead={(id) => markAsReadMutation.mutate(Number(id))}
                onMarkAllAsRead={() => markAllAsReadMutation.mutate()}
                onDelete={(id) => deleteMutation.mutate(Number(id))}
              />
            )}
            <button
              className="p-2 rounded-md text-gray-600 hover:text-green-600 hover:bg-gray-100 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <nav className="flex flex-col gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                >
                  {item.label}
                </Link>
              ))}
              <div className="pt-4 border-t border-gray-200 mt-2">
                <div className="relative mb-4">
                  <SearchBar onClose={() => setMobileMenuOpen(false)} />
                </div>
                <div className="flex flex-col gap-2">
                  {isAuthenticated ? (
                    <>
                      {(user?.role === "super_admin" || user?.role === "admin") && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full border-red-200 text-red-600"
                          onClick={() => navigate("/super-admin/dashboard")}
                        >
                          Admin Dashboard
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className={`w-full justify-start gap-2 ${user?.isVerified ? "text-blue-600 border-blue-200" : "text-amber-600 border-amber-200"}`}
                        onClick={() => {
                          navigate("/verification");
                          setMobileMenuOpen(false);
                        }}
                      >
                        {user?.isVerified ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                        {user?.isVerified ? "Verified Account" : "Unverified - Click to Verify"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start gap-2"
                        onClick={() => navigate("/messages")}
                      >
                        <MessageSquare className="w-4 h-4" /> Messages
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start gap-2 relative"
                        onClick={() => navigate("/cart")}
                      >
                        <ShoppingCart className="w-4 h-4" /> Cart
                        {cartItemsCount > 0 && (
                          <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                            {cartItemsCount}
                          </span>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start gap-2"
                        onClick={() => navigate("/profile")}
                      >
                        <User className="w-4 h-4" /> Profile
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start gap-2"
                        onClick={() => navigate("/buyer/dashboard")}
                      >
                        <ShoppingCart className="w-4 h-4 text-orange-500" /> Buyer Dashboard
                      </Button>
                      {isProfessional && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-start gap-2"
                          onClick={() => navigate("/seller/dashboard")}
                        >
                          <Package className="w-4 h-4 text-green-600" /> Seller Dashboard
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleLogout}
                        className="w-full justify-start text-red-600 border-red-200"
                      >
                        Logout
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => navigate("/login")}
                    >
                      Login
                    </Button>
                  )}
                  <Button
                    size="sm"
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    onClick={handlePostAd}
                  >
                    Post Ad
                  </Button>
                </div>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}