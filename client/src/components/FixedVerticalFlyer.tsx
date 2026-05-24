import { useState } from "react";

interface FixedVerticalFlyerProps {
  position: "left" | "right";
  adNumber: number;
  adTitle?: string;
  adUrl?: string;
}

export default function FixedVerticalFlyer({
  position,
  adNumber,
  adTitle = "Premium Ad",
  adUrl = "#",
}: FixedVerticalFlyerProps) {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed top-1/2 transform -translate-y-1/2 z-40 hidden lg:flex ${
        position === "left" ? "left-2" : "right-2"
      }`}
    >
      <a
        href={adUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex flex-col items-center justify-center w-20 h-32 bg-gradient-to-br from-accent to-accent/80 rounded-lg shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 border-2 border-accent/50 group"
      >
        {/* Ad Number Badge */}
        <div className="flex items-center justify-center w-full h-full">
          <div className="text-center">
            <div className="text-white text-2xl font-bold group-hover:text-white/80 transition">
              {adNumber}
            </div>
            <div className="text-white text-xs font-semibold mt-1 opacity-80 group-hover:opacity-100 transition">
              AD
            </div>
          </div>
        </div>

        {/* Hover Effect */}
        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg" />
      </a>
    </div>
  );
}
