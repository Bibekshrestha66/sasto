interface InlineAdBadgeProps {
  number: number;
  accentColor?: "green" | "red" | "purple";
  size?: "small" | "medium" | "large";
}

export default function InlineAdBadge({
  number,
  accentColor = "green",
  size = "medium",
}: InlineAdBadgeProps) {
  const colorClasses = {
    green: "bg-accent text-white",
    red: "bg-red-600 text-white",
    purple: "bg-purple-600 text-white",
  };

  const sizeClasses = {
    small: "w-8 h-8 text-xs",
    medium: "w-12 h-12 text-sm",
    large: "w-16 h-16 text-lg",
  };

  return (
    <div
      className={`flex items-center justify-center rounded-full font-bold ${colorClasses[accentColor]} ${sizeClasses[size]} shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 cursor-pointer`}
    >
      {number}
    </div>
  );
}
