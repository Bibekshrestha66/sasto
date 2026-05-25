import React from 'react';
import { Star, Shield, Trophy } from 'lucide-react';

interface SellerBadgeProps {
  rating: number;
  reviewCount: number;
  isVerified?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function SellerBadge({
  rating,
  reviewCount,
  isVerified = false,
  size = 'md',
}: SellerBadgeProps) {
  // Determine badge tier based on rating and review count
  const getBadgeTier = () => {
    if (rating >= 4.7 && reviewCount >= 50) return 'gold';
    if (rating >= 4.3 && reviewCount >= 20) return 'silver';
    if (rating >= 4.0 && reviewCount >= 5) return 'bronze';
    return null;
  };

  const tier = getBadgeTier();

  const badgeConfig = {
    gold: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-700',
      icon: 'text-yellow-600',
      label: 'Gold Seller',
      description: 'Excellent seller with 50+ reviews',
    },
    silver: {
      bg: 'bg-gray-50',
      border: 'border-gray-200',
      text: 'text-gray-700',
      icon: 'text-gray-600',
      label: 'Silver Seller',
      description: 'Trusted seller with 20+ reviews',
    },
    bronze: {
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      text: 'text-orange-700',
      icon: 'text-orange-600',
      label: 'Bronze Seller',
      description: 'Reliable seller with 5+ reviews',
    },
  };

  const sizeConfig = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-3 text-base',
  };

  if (!tier) {
    return null;
  }

  const config = badgeConfig[tier];
  const sizeClass = sizeConfig[size];

  return (
    <div className={`inline-flex items-center gap-2 ${sizeClass} rounded-lg border ${config.bg} ${config.border}`}>
      {tier === 'gold' && <Trophy className={`w-4 h-4 ${config.icon}`} />}
      {tier === 'silver' && <Shield className={`w-4 h-4 ${config.icon}`} />}
      {tier === 'bronze' && <Star className={`w-4 h-4 ${config.icon}`} />}

      <div>
        <p className={`font-semibold ${config.text}`}>{config.label}</p>
        {size === 'lg' && <p className={`text-xs ${config.text} opacity-75`}>{config.description}</p>}
      </div>

      {isVerified && (
        <div className="ml-2 flex items-center gap-1">
          <Shield className={`w-3 h-3 ${config.icon}`} />
          <span className={`text-xs font-medium ${config.text}`}>Verified</span>
        </div>
      )}
    </div>
  );
}

interface SellerRatingProps {
  rating: number;
  reviewCount: number;
  compact?: boolean;
}

export function SellerRating({ rating, reviewCount, compact = false }: SellerRatingProps) {
  const stars = Array.from({ length: 5 }, (_, i) => i < Math.floor(rating));

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        <div className="flex gap-0.5">
          {stars.map((filled, i) => (
            <Star
              key={i}
              className={`w-3 h-3 ${filled ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
            />
          ))}
        </div>
        <span className="text-xs font-medium text-gray-700">
          {rating.toFixed(1)} ({reviewCount})
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex gap-1">
        {stars.map((filled, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${filled ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
          />
        ))}
      </div>
      <div>
        <p className="font-semibold text-gray-900">{rating.toFixed(1)}</p>
        <p className="text-sm text-gray-600">{reviewCount} reviews</p>
      </div>
    </div>
  );
}
