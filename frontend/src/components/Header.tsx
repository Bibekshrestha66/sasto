import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Search, Menu, X, MessageSquare, User, ShieldCheck, ShieldAlert, ShoppingCart, Package, LogOut, Settings } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState, useCallback, useEffect, useMemo } from "react";
import NotificationCenter from "@/components/NotificationCenter";
import { trpc } from "@/lib/trpc";
import { useWebSocket } from "@/hooks/useWebSocket";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Static data
const navItems = [
  { label: "Home", href: "/" },
  { label: "Marketplace", href: "/marketplace" },
  { label: "Auctions", href: "/auctions" },
  { label: "Rentals", href: "/rentals" },
  { label: "Deals", href: "/deals-and-offers" },
  { label: "About", href: "/about" },
  { label: "Help", href: "/help" },
];

export default function Header() {
  const { user, logout, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location] = useLocation();

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

  // WebSocket for instant notification updates
  const { onNewNotification } = useWebSocket();

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
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm transition-all duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          
          {/* Left: Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0 group">
            <div className="w-8 h-8 lg:w-10 lg:h-10 bg-green-600 rounded-lg flex items-center justify-center shadow-sm group-hover:bg-green-700 transition-colors">
              <span className="text-white font-bold text-lg lg:text-xl">S</span>
            </div>
            <span className="text-xl sm:text-2xl font-bold text-green-700 tracking-tight">
              Sasto
            </span>
          </Link>

          {/* Middle: Desktop Navigation */}
          <nav className="hidden lg:flex items-center justify-center gap-6 xl:gap-8 flex-1 mx-8 min-w-0">
            {navItems.map((item) => {
              const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`text-[15px] font-medium transition-all relative py-2 ${
                    isActive 
                      ? "text-green-600" 
                      : "text-gray-600 hover:text-green-600"
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 w-full h-[3px] bg-green-600 rounded-t-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right: Actions */}
          <div className="flex items-center gap-3 shrink-0">
            {isAuthenticated ? (
              <div className="hidden md:flex items-center gap-1 xl:gap-2 mr-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-full w-9 h-9"
                  onClick={() => navigate("/messages")}
                  aria-label="Messages"
                >
                  <MessageSquare className="w-[18px] h-[18px]" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-full w-9 h-9 relative"
                  onClick={() => navigate("/cart")}
                  aria-label="Cart"
                >
                  <ShoppingCart className="w-[18px] h-[18px]" />
                  {cartItemsCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white border-2 border-white">
                      {cartItemsCount}
                    </span>
                  )}
                </Button>

                <div className="mx-1">
                  <NotificationCenter
                    notifications={formattedNotifications}
                    onMarkAsRead={(id) => markAsReadMutation.mutate(Number(id))}
                    onMarkAllAsRead={() => markAllAsReadMutation.mutate()}
                    onDelete={(id) => deleteMutation.mutate(Number(id))}
                  />
                </div>

                <div className="h-6 w-px bg-gray-200 mx-2" />

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-9 w-9 rounded-full ml-1 p-0 overflow-hidden">
                      <Avatar className="h-9 w-9 border border-gray-200 hover:border-green-300 transition-colors">
                        <AvatarImage src="" alt={user?.name || "User"} />
                        <AvatarFallback className="bg-green-100 text-green-700 font-semibold text-sm">
                          {user?.name?.charAt(0).toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      {!user?.isVerified && !isAdmin && (
                        <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-500 border-2 border-white" title="Unverified">
                          <ShieldAlert className="w-2 h-2 text-white" />
                        </span>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 mt-2 rounded-xl shadow-lg border-gray-100" align="end" forceMount>
                    <div className="flex items-center justify-start gap-2 p-3">
                      <div className="flex flex-col space-y-1 leading-none">
                        <p className="font-medium text-[15px]">{user?.name}</p>
                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    {(isAdmin) && (
                      <DropdownMenuItem onClick={() => navigate("/super-admin/dashboard")} className="cursor-pointer py-2.5 text-red-600 focus:text-red-600 focus:bg-red-50">
                        <Settings className="mr-2 h-4 w-4" />
                        <span className="font-medium">Admin Dashboard</span>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => navigate("/profile")} className="cursor-pointer py-2.5">
                      <User className="mr-2 h-4 w-4 text-gray-500" />
                      <span className="font-medium">Profile Settings</span>
                    </DropdownMenuItem>
                    {!user?.isVerified && !isAdmin && (
                      <DropdownMenuItem onClick={() => navigate("/verification")} className="cursor-pointer py-2.5 text-amber-600 focus:text-amber-600 focus:bg-amber-50">
                        <ShieldAlert className="mr-2 h-4 w-4" />
                        <span className="font-medium">Verify Account</span>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer py-2.5 text-red-600 focus:text-red-600 focus:bg-red-50">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span className="font-medium">Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2 mr-2">
                <Button
                  variant="ghost"
                  className="font-medium text-gray-600 hover:text-green-600 rounded-full"
                  onClick={() => navigate("/login")}
                >
                  Log in
                </Button>
                <Button
                  variant="outline"
                  className="font-medium border-gray-200 hover:border-green-600 hover:bg-green-50 hover:text-green-600 rounded-full"
                  onClick={() => navigate("/register")}
                >
                  Sign up
                </Button>
              </div>
            )}

            <Button
              className="bg-green-600 hover:bg-green-700 text-white shadow-sm font-medium rounded-full px-5 hidden sm:flex h-9 lg:h-10 transition-transform active:scale-95"
              onClick={handlePostAd}
            >
              Post Ad
            </Button>
            
            {/* Mobile Nav Triggers */}
            <div className="flex md:hidden items-center gap-1">
              {isAuthenticated && (
                <>
                  <NotificationCenter
                    notifications={formattedNotifications}
                    onMarkAsRead={(id) => markAsReadMutation.mutate(Number(id))}
                    onMarkAllAsRead={() => markAllAsReadMutation.mutate()}
                    onDelete={(id) => deleteMutation.mutate(Number(id))}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-gray-500 hover:text-green-600 rounded-full w-9 h-9 relative"
                    onClick={() => navigate("/cart")}
                  >
                    <ShoppingCart className="w-5 h-5" />
                    {cartItemsCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white border-2 border-white">
                        {cartItemsCount}
                      </span>
                    )}
                  </Button>
                </>
              )}
              <button
                className="p-2 rounded-full text-gray-600 hover:text-green-600 hover:bg-gray-100 transition-colors ml-1"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      <div 
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out bg-white ${
          mobileMenuOpen ? "max-h-[85vh] border-t border-gray-100 opacity-100 shadow-lg" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-4 py-6 space-y-6 overflow-y-auto max-h-[85vh]">
          
          <Button
            className="w-full bg-green-600 hover:bg-green-700 text-white rounded-xl h-12 text-base font-medium shadow-sm"
            onClick={handlePostAd}
          >
            Post an Ad
          </Button>

          {/* Mobile Links */}
          <nav className="flex flex-col gap-1">
            <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-3">Navigation</h3>
            {navItems.map((item) => {
              const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`px-3 py-3 text-[15px] font-medium rounded-xl transition-colors flex items-center justify-between ${
                    isActive 
                      ? "bg-green-50 text-green-700" 
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {item.label}
                  {isActive && <div className="w-1.5 h-1.5 rounded-full bg-green-600" />}
                </Link>
              );
            })}
          </nav>

          <div className="h-px bg-gray-100" />

          {/* Mobile User Actions */}
          <div className="flex flex-col gap-1">
            <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-3">Account</h3>
            {isAuthenticated ? (
              <>
                {isAdmin && (
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 h-12 text-[15px] font-medium rounded-xl px-3"
                    onClick={() => navigate("/super-admin/dashboard")}
                  >
                    <Settings className="w-5 h-5 mr-3" /> Admin Dashboard
                  </Button>
                )}
                <Button
                  variant="ghost"
                  className="w-full justify-start text-gray-700 hover:bg-gray-50 h-12 text-[15px] font-medium rounded-xl px-3"
                  onClick={() => navigate("/profile")}
                >
                  <User className="w-5 h-5 mr-3 text-gray-400" /> Profile Settings
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-gray-700 hover:bg-gray-50 h-12 text-[15px] font-medium rounded-xl px-3"
                  onClick={() => navigate("/messages")}
                >
                  <MessageSquare className="w-5 h-5 mr-3 text-gray-400" /> Messages
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-gray-700 hover:bg-gray-50 h-12 text-[15px] font-medium rounded-xl px-3"
                  onClick={() => navigate("/buyer/dashboard")}
                >
                  <ShoppingCart className="w-5 h-5 mr-3 text-gray-400" /> Buyer Dashboard
                </Button>
                {isProfessional && (
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-gray-700 hover:bg-gray-50 h-12 text-[15px] font-medium rounded-xl px-3"
                    onClick={() => navigate("/seller/dashboard")}
                  >
                    <Package className="w-5 h-5 mr-3 text-gray-400" /> Seller Dashboard
                  </Button>
                )}
                {!user?.isVerified && !isAdmin && (
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-amber-600 hover:text-amber-700 hover:bg-amber-50 h-12 text-[15px] font-medium rounded-xl px-3"
                    onClick={() => navigate("/verification")}
                  >
                    <ShieldAlert className="w-5 h-5 mr-3" /> Verify Account
                  </Button>
                )}
                <Button
                  variant="ghost"
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 h-12 text-[15px] font-medium rounded-xl px-3 mt-2"
                  onClick={handleLogout}
                >
                  <LogOut className="w-5 h-5 mr-3" /> Log out
                </Button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-3 mt-2">
                <Button
                  variant="outline"
                  className="w-full h-12 border-gray-200 rounded-xl font-medium"
                  onClick={() => navigate("/login")}
                >
                  Log in
                </Button>
                <Button
                  className="w-full h-12 bg-green-50 text-green-700 hover:bg-green-100 rounded-xl shadow-none font-medium"
                  onClick={() => navigate("/register")}
                >
                  Sign up
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}