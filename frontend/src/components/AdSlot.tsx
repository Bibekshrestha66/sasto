import { useEffect } from "react";

interface AdSlotProps {
  adSlot: string;
  adFormat?: "auto" | "rectangle" | "vertical" | "horizontal";
  fullWidth?: boolean;
  className?: string;
}

/**
 * AdSlot Component for Google AdSense
 * Usage: <AdSlot adSlot="1234567890" adFormat="rectangle" />
 * 
 * Ad Slot IDs should be configured in environment variables:
 * VITE_GOOGLE_ADSENSE_CLIENT_ID=ca-pub-xxxxxxxxxxxxxxxx
 */
export function AdSlot({
  adSlot,
  adFormat = "auto",
  fullWidth = false,
  className = "",
}: AdSlotProps) {
  useEffect(() => {
    // Push AdSense ads when component mounts
    try {
      if (window.adsbygoogle) {
        window.adsbygoogle.push({});
      }
    } catch (error) {
      console.warn("[AdSense] Error pushing ads:", error);
    }
  }, [adSlot]);

  return (
    <div
      className={`ad-slot-container ${className}`}
      data-ad-slot={adSlot}
      data-ad-format={adFormat}
      data-full-width={fullWidth}
    >
      <ins
        className="adsbygoogle"
        style={{
          display: "block",
          textAlign: "center",
          minHeight: "100px",
          backgroundColor: "#f5f5f5",
          borderRadius: "8px",
          padding: "10px",
        }}
        data-ad-client={import.meta.env.VITE_GOOGLE_ADSENSE_CLIENT_ID || ""}
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width={fullWidth}
      ></ins>
    </div>
  );
}

// Declare global window object for AdSense
declare global {
  interface Window {
    adsbygoogle?: Array<Record<string, unknown>>;
  }
}
