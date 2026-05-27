import React from "react";
import { useLocation } from "wouter";

export default function Footer() {
  const [, navigate] = useLocation();

  const handleNavigate = (path: string) => {
    navigate(path);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="bg-gray-900 border-t border-gray-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-6">
        {/* Responsive grid: 2 columns on mobile, 5 columns on desktop */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1 text-left">
            <h3 className="text-sm font-bold text-green-500 mb-2">Sasto</h3>
            <p className="text-green-600/80 text-xs leading-relaxed max-w-sm">
              Nepal's #1 marketplace for buying, selling, renting, and auctions.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-green-500 mb-2 text-xs">Links</h4>
            <ul className="space-y-1.5 text-xs">
              <li><button onClick={() => handleNavigate("/marketplace")} className="text-green-600/80 hover:text-green-500 transition-colors">Marketplace</button></li>
              <li><button onClick={() => handleNavigate("/auctions")} className="text-green-600/80 hover:text-green-500 transition-colors">Auctions</button></li>
              <li><button onClick={() => handleNavigate("/rentals")} className="text-green-600/80 hover:text-green-500 transition-colors">Rentals</button></li>
              <li><button onClick={() => handleNavigate("/career")} className="text-green-600/80 hover:text-green-500 transition-colors">Career</button></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-green-500 mb-2 text-xs">Legal</h4>
            <ul className="space-y-1.5 text-xs">
              <li><button onClick={() => handleNavigate("/terms")} className="text-green-600/80 hover:text-green-500 transition-colors">Terms</button></li>
              <li><button onClick={() => handleNavigate("/privacy")} className="text-green-600/80 hover:text-green-500 transition-colors">Privacy</button></li>
              <li><button onClick={() => handleNavigate("/report")} className="text-green-600/80 hover:text-green-500 transition-colors">Report Issue</button></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold text-green-500 mb-2 text-xs">Support</h4>
            <ul className="space-y-1.5 text-xs">
              <li><button onClick={() => handleNavigate("/help")} className="text-green-600/80 hover:text-green-500 transition-colors">Help Center</button></li>
              <li><button onClick={() => handleNavigate("/about")} className="text-green-600/80 hover:text-green-500 transition-colors">About Us</button></li>
              <li><button onClick={() => handleNavigate("/contact")} className="text-green-600/80 hover:text-green-500 transition-colors">Contact</button></li>
              <li><button onClick={() => handleNavigate("/safety-tips")} className="text-green-600/80 hover:text-green-500 transition-colors">Safety Tips</button></li>
            </ul>
          </div>

          {/* Partners */}
          <div>
            <h4 className="font-semibold text-green-500 mb-2 text-xs">Partners</h4>
            <ul className="space-y-1.5 text-xs">
              <li><button onClick={() => handleNavigate("/partners/prabhu-bank")} className="text-green-600/80 hover:text-green-500 transition-colors">Prabhu Bank</button></li>
              <li><button onClick={() => handleNavigate("/partners/fonepay")} className="text-green-600/80 hover:text-green-500 transition-colors">Fonepay</button></li>
              <li><button onClick={() => handleNavigate("/partners/esewa")} className="text-green-600/80 hover:text-green-500 transition-colors">eSewa</button></li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-800 mt-6 md:mt-5 pt-4 md:pt-3 text-center">
          <p className="text-[11px] md:text-[10px] text-green-600/70">
            © {new Date().getFullYear()} Sasto. All rights reserved. Made in Nepal.
          </p>
        </div>
      </div>
    </footer>
  );
}