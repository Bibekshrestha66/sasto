import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeroBannerProps {
  title: string;
  subtitle: string;
  ctaText?: string;
  ctaUrl?: string;
  backgroundImage?: string;
  accentColor?: "green" | "red" | "purple";
}

export default function HeroBanner({
  title,
  subtitle,
  ctaText = "Get Started",
  ctaUrl = "#",
  backgroundImage,
  accentColor = "green",
}: HeroBannerProps) {
  const colorClasses = {
    green: "from-accent/10 to-accent/5 border-accent/20",
    red: "from-red-500/10 to-red-500/5 border-red-500/20",
    purple: "from-purple-500/10 to-purple-500/5 border-purple-500/20",
  };

  const textColorClasses = {
    green: "text-accent",
    red: "text-red-600",
    purple: "text-purple-600",
  };

  const buttonColorClasses = {
    green: "bg-accent hover:bg-accent/90 text-accent-foreground",
    red: "bg-red-600 hover:bg-red-700 text-white",
    purple: "bg-purple-600 hover:bg-purple-700 text-white",
  };

  return (
    <div
      className={`w-full rounded-2xl overflow-hidden border-2 ${colorClasses[accentColor]} bg-gradient-to-br ${colorClasses[accentColor]} backdrop-blur-sm`}
      style={
        backgroundImage
          ? {
              backgroundImage: `url(${backgroundImage})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
          : {}
      }
    >
      <div className="relative">
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent" />

        {/* Content */}
        <div className="relative px-8 py-12 md:px-12 md:py-16 lg:px-16 lg:py-20 flex items-center justify-between">
          {/* Left Side - Text */}
          <div className="flex-1 max-w-2xl">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 leading-tight">
              {title}
            </h2>
            <p className="text-lg md:text-xl text-white/90 mb-6 font-medium">
              {subtitle}
            </p>
            <a href={ctaUrl}>
              <Button
                size="lg"
                className={`${buttonColorClasses[accentColor]} font-semibold text-base px-8 py-6 rounded-lg group`}
              >
                {ctaText}
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </a>
          </div>

          {/* Right Side - Decorative Element */}
          <div className="hidden lg:flex items-center justify-center flex-1 ml-8">
            <div className="w-48 h-48 bg-gradient-to-br from-accent/20 to-accent/5 rounded-full blur-3xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
