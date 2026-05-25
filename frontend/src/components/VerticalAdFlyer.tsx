import React from 'react';
import { X } from 'lucide-react';

interface VerticalAdFlyerProps {
  position: 'left' | 'right';
  adSlot: string;
  onClose?: () => void;
}

export function VerticalAdFlyer({ position, adSlot, onClose }: VerticalAdFlyerProps) {

  const positionClass = position === 'left' ? 'left-4' : 'right-4';

  return (
    <div
      className={`fixed ${positionClass} top-1/2 -translate-y-1/2 z-40 hidden lg:block`}
      style={{ maxWidth: '160px' }}
    >
      <div className="relative bg-white rounded-xl shadow-2xl border-2 border-gradient-to-b from-green-400 to-green-600 overflow-hidden hover:shadow-3xl transition-all duration-300">

        {/* Ad Container */}
        <div className="p-3 bg-gradient-to-br from-green-50 to-white">
          {/* Premium Badge */}
          <div className="mb-2">
            <span className="inline-block bg-gradient-to-r from-green-500 to-green-600 text-white text-xs font-bold px-2 py-1 rounded-full">
              PREMIUM AD
            </span>
          </div>

          {/* Ad Slot - Google AdSense */}
          <div className="bg-gray-100 rounded-lg p-2 min-h-[300px] flex items-center justify-center text-center">
            <div className="text-gray-500 text-xs">
              <div className="text-2xl mb-2">📢</div>
              <p className="font-semibold text-gray-700">Your Ad Here</p>
              <p className="text-xs mt-1">Premium Placement</p>
            </div>
          </div>

          {/* CTA Button */}
          <button className="w-full mt-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold py-2 px-3 rounded-lg hover:shadow-lg transition-all text-sm hover:scale-105 transform">
            Learn More
          </button>

          {/* Footer Text */}
          <p className="text-xs text-gray-500 text-center mt-2">Advertisement</p>
        </div>

        {/* Decorative Border */}
        <div className="absolute inset-0 rounded-xl pointer-events-none border-2 border-transparent bg-gradient-to-r from-green-400 via-transparent to-green-400 opacity-0 hover:opacity-20 transition-opacity" />
      </div>
    </div>
  );
}
