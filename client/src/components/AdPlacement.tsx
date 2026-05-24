import React, { useEffect } from 'react';
import { trpc } from '../lib/trpc';

interface AdPlacementProps {
  placement: string;
  className?: string;
}

/**
 * AdPlacement component for displaying Google AdSense and manual ads
 * Supports multiple placement types: homepage, sidebar, category, listing detail, search results
 */
export const AdPlacement: React.FC<AdPlacementProps> = ({ placement, className = '' }) => {
  const { data: ads, isLoading } = trpc.ads.getActiveAds.useQuery({ placement });
  const recordImpression = trpc.ads.recordAdImpression.useMutation();
  const recordClick = trpc.ads.recordAdClick.useMutation();

  useEffect(() => {
    // Load Google AdSense script if not already loaded
    if (typeof window !== 'undefined' && !(window as any).adsbygoogle) {
      const script = document.createElement('script');
      script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-xxxxxxxxxxxxxxxx';
      script.async = true;
      script.crossOrigin = 'anonymous';
      document.head.appendChild(script);
    }
  }, []);

  if (isLoading) {
    return (
      <div className={`bg-gray-100 rounded-lg animate-pulse ${className}`}>
        <div className="h-48 bg-gray-200"></div>
      </div>
    );
  }

  // Display manual ads if available
  if (ads && ads.length > 0) {
    const ad = ads[0];
    return (
      <div
        className={`rounded-lg overflow-hidden border border-green-200 hover:border-green-400 transition-all duration-300 ${className}`}
        onClick={() => {
          // Record ad impression
          recordImpression.mutate({ adId: ad.id });
        }}
      >
        <a
          href={ad.landingUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => {
            // Record ad click
            recordClick.mutate({ adId: ad.id });
          }}
          className="block"
        >
          <div className="relative bg-white" style={{ aspectRatio: '4/3' }}>
            <img
              src={ad.imageUrl}
              alt={ad.title}
              className="w-full h-full object-contain hover:opacity-90 transition-opacity"
            />
          </div>
          <div className="p-3 bg-white">
            <h3 className="font-semibold text-sm text-gray-800 line-clamp-2">
              {ad.title}
            </h3>
            {ad.description && (
              <p className="text-xs text-gray-600 line-clamp-1 mt-1">
                {ad.description}
              </p>
            )}
          </div>
        </a>
        <div className="px-3 py-2 bg-green-50 border-t border-green-100 text-xs text-green-700 font-medium">
          Sponsored
        </div>
      </div>
    );
  }

  // Display Google AdSense placeholder
  return (
    <div className={`bg-gray-50 rounded-lg border border-dashed border-gray-300 p-4 text-center text-gray-500 text-sm ${className}`}>
      <div className="ins" data-ad-client="ca-pub-xxxxxxxxxxxxxxxx" data-ad-slot="xxxxxxxxxx" data-ad-format="auto"></div>
      {typeof window !== 'undefined' && (window as any).adsbygoogle && (
        <script>
          {`(adsbygoogle = window.adsbygoogle || []).push({});`}
        </script>
      )}
    </div>
  );
};

export default AdPlacement;
