import { Card } from "@/components/ui/card";

/**
 * Skeleton component for listing cards
 */
export function ListingCardSkeleton() {
  return (
    <Card className="overflow-hidden border-2 border-dashed border-accent animate-pulse">
      <div className="bg-gray-200 aspect-square" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
        <div className="h-4 bg-gray-200 rounded w-2/3" />
      </div>
    </Card>
  );
}

/**
 * Skeleton component for listing grid
 */
export function ListingGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <ListingCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Skeleton component for listing detail page
 */
export function ListingDetailSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Image Gallery */}
          <Card className="overflow-hidden border-2 border-dashed border-accent">
            <div className="bg-gray-200 aspect-square" />
            <div className="p-4 flex gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="w-20 h-20 bg-gray-200 rounded" />
              ))}
            </div>
          </Card>

          {/* Details */}
          <Card className="p-6 border-2 border-dashed border-accent space-y-4">
            <div className="h-8 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 rounded w-full" />
              <div className="h-3 bg-gray-200 rounded w-5/6" />
              <div className="h-3 bg-gray-200 rounded w-4/5" />
            </div>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {/* Seller Card */}
          <Card className="p-4 border-2 border-dashed border-accent space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gray-200 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
            <div className="h-10 bg-gray-200 rounded" />
          </Card>

          {/* Action Buttons */}
          <div className="space-y-2">
            <div className="h-10 bg-gray-200 rounded" />
            <div className="h-10 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton component for review card
 */
export function ReviewCardSkeleton() {
  return (
    <Card className="p-4 border-2 border-dashed border-accent animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
          <div className="flex gap-1 mb-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="w-4 h-4 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
        <div className="h-3 bg-gray-200 rounded w-20" />
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-gray-200 rounded w-full" />
        <div className="h-3 bg-gray-200 rounded w-5/6" />
      </div>
    </Card>
  );
}

/**
 * Skeleton component for dashboard
 */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-4 border-2 border-dashed border-accent">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
            <div className="h-8 bg-gray-200 rounded w-2/3" />
          </Card>
        ))}
      </div>

      {/* Chart */}
      <Card className="p-6 border-2 border-dashed border-accent">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4" />
        <div className="h-64 bg-gray-200 rounded" />
      </Card>

      {/* Table */}
      <Card className="p-6 border-2 border-dashed border-accent">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 rounded" />
          ))}
        </div>
      </Card>
    </div>
  );
}

/**
 * Skeleton component for user profile
 */
export function ProfileSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <Card className="p-6 border-2 border-dashed border-accent">
        <div className="flex items-start gap-4">
          <div className="w-24 h-24 bg-gray-200 rounded-full" />
          <div className="flex-1 space-y-3">
            <div className="h-6 bg-gray-200 rounded w-1/3" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
            <div className="h-4 bg-gray-200 rounded w-2/3" />
          </div>
        </div>
      </Card>

      {/* Content Sections */}
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="p-6 border-2 border-dashed border-accent space-y-3">
          <div className="h-5 bg-gray-200 rounded w-1/4" />
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded w-full" />
            <div className="h-3 bg-gray-200 rounded w-5/6" />
          </div>
        </Card>
      ))}
    </div>
  );
}
