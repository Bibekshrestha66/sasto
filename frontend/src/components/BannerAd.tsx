import React from 'react';

interface BannerAdProps {
  position: 'top' | 'bottom' | 'middle';
  adSlot: string;
  backgroundColor?: string;
}

export function BannerAd({ position, adSlot, backgroundColor = 'from-green-50 to-green-100' }: BannerAdProps) {
  const positionClasses = {
    top: 'mt-0 mb-6',
    middle: 'my-8',
    bottom: 'mt-8 mb-0'
  };

  return (
    <div className={`w-full ${positionClasses[position]}`}>
      <div className={`bg-gradient-to-r ${backgroundColor} rounded-xl border-2 border-green-300 shadow-lg p-6 md:p-8`}>
        {/* Banner Ad Container */}
        <div className="flex items-center justify-center min-h-[120px] md:min-h-[150px] bg-white rounded-lg border-2 border-dashed border-green-300">
          <div className="text-center">
            <div className="text-4xl mb-2">📢</div>
            <p className="text-gray-600 font-semibold">Premium Banner Advertisement</p>
            <p className="text-sm text-gray-500 mt-1">Your Ad Here - {adSlot}</p>
          </div>
        </div>

        {/* Ad Info */}
        <div className="mt-4 flex justify-between items-center px-4">
          <span className="inline-block bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
            FEATURED BANNER
          </span>
          <button className="text-green-600 hover:text-green-700 font-semibold text-sm">
            Learn More →
          </button>
        </div>
      </div>
    </div>
  );
}
