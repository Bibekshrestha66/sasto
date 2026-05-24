import { useState } from "react";
import { Star } from "lucide-react";

interface RatingStarsProps {
  value: number;
  onChange?: (rating: number) => void;
  readOnly?: boolean;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export function RatingStars({
  value,
  onChange,
  readOnly = false,
  size = "md",
  showLabel = true,
}: RatingStarsProps) {
  const [hoverRating, setHoverRating] = useState(0);

  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  const displayRating = hoverRating || value;

  const labels = {
    1: "Poor",
    2: "Fair",
    3: "Good",
    4: "Very Good",
    5: "Excellent",
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => {
          const rating = i + 1;
          const isFilled = rating <= displayRating;

          return (
            <button
              key={i}
              onClick={() => !readOnly && onChange?.(rating)}
              onMouseEnter={() => !readOnly && setHoverRating(rating)}
              onMouseLeave={() => !readOnly && setHoverRating(0)}
              disabled={readOnly}
              className={`transition-colors ${
                readOnly ? "cursor-default" : "cursor-pointer hover:scale-110"
              }`}
            >
              <Star
                className={`${sizeClasses[size]} ${
                  isFilled
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-300"
                }`}
              />
            </button>
          );
        })}
      </div>

      {showLabel && displayRating > 0 && (
        <span className="text-sm font-medium text-gray-600 ml-2">
          {labels[displayRating as keyof typeof labels]}
        </span>
      )}
    </div>
  );
}
