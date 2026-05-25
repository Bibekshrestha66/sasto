import { Link, useLocation } from "wouter";
import { Home, MessageSquare, PlusCircle, User, Search } from "lucide-react";

export default function BottomNav() {
  const [location] = useLocation();

  const navItems = [
    { label: "Home", href: "/", icon: Home },
    { label: "Search", href: "/marketplace", icon: Search },
    { label: "Post Ad", href: "/post-listing", icon: PlusCircle },
    { label: "Messages", href: "/messages", icon: MessageSquare },
    { label: "Profile", href: "/profile", icon: User },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-2 flex items-center justify-between z-50 pb-safe shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
      {navItems.map((item) => {
        const isActive = location === item.href;
        const Icon = item.icon;

        return (
          <Link key={item.label} href={item.href} className="flex flex-col items-center transition-colors">
            <Icon className={`w-5 h-5 ${isActive ? "text-green-600" : "text-gray-400"}`} />
            <span className={`text-[10px] mt-1 font-medium ${isActive ? "text-green-600" : "text-gray-400"} uppercase tracking-tighter`}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
