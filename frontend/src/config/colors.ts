/**
 * Color configuration for Sasto Marketplace
 * Matches the design from the screenshot
 */

export const colors = {
  // Primary colors by section
  auction: {
    primary: "#FF5722", // Red-Orange
    light: "#FFEBEE",
    dark: "#D84315",
    gradient: "from-orange-500 to-red-600",
  },
  rental: {
    primary: "#9C27B0", // Purple
    light: "#F3E5F5",
    dark: "#6A1B9A",
    gradient: "from-purple-500 to-purple-700",
  },
  marketplace: {
    primary: "#4CAF50", // Green
    light: "#E8F5E9",
    dark: "#2E7D32",
    gradient: "from-green-500 to-green-700",
  },

  // Neutral colors
  neutral: {
    white: "#FFFFFF",
    black: "#000000",
    gray50: "#F9FAFB",
    gray100: "#F3F4F6",
    gray200: "#E5E7EB",
    gray300: "#D1D5DB",
    gray400: "#9CA3AF",
    gray500: "#6B7280",
    gray600: "#4B5563",
    gray700: "#374151",
    gray800: "#1F2937",
    gray900: "#111827",
  },

  // Status colors
  status: {
    success: "#10B981",
    warning: "#F59E0B",
    error: "#EF4444",
    info: "#3B82F6",
  },

  // Badge colors
  badges: {
    featured: "#FF5722",
    live: "#EF4444",
    sold: "#6B7280",
    new: "#10B981",
    popular: "#F59E0B",
  },
};

/**
 * Get color by section type
 */
export function getColorBySection(section: "auction" | "rental" | "marketplace") {
  return colors[section];
}

/**
 * Get gradient by section type
 */
export function getGradientBySection(section: "auction" | "rental" | "marketplace") {
  return colors[section].gradient;
}

/**
 * Tailwind color classes
 */
export const tailwindColors = {
  auction: {
    bg: "bg-orange-500",
    bgLight: "bg-orange-50",
    bgDark: "bg-orange-600",
    text: "text-orange-600",
    textLight: "text-orange-500",
    border: "border-orange-500",
    ring: "ring-orange-500",
    hover: "hover:bg-orange-600",
  },
  rental: {
    bg: "bg-purple-500",
    bgLight: "bg-purple-50",
    bgDark: "bg-purple-600",
    text: "text-purple-600",
    textLight: "text-purple-500",
    border: "border-purple-500",
    ring: "ring-purple-500",
    hover: "hover:bg-purple-600",
  },
  marketplace: {
    bg: "bg-green-500",
    bgLight: "bg-green-50",
    bgDark: "bg-green-600",
    text: "text-green-600",
    textLight: "text-green-500",
    border: "border-green-500",
    ring: "ring-green-500",
    hover: "hover:bg-green-600",
  },
};
