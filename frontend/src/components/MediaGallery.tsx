import { useState } from "react";
import { Play, Image as ImageIcon, Heart } from "lucide-react";

interface MediaGalleryProps {
  images: string[];
  videoUrl?: string | null;
  type?: string;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  title: string;
}

export function MediaGallery({ images, videoUrl, type, isFavorite, onToggleFavorite, title }: MediaGalleryProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [activeMedia, setActiveMedia] = useState<"photos" | "video">("photos");

  const displayImages = images && images.length > 0 ? images : [`https://picsum.photos/seed/${title}/800/600`];

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
      {/* Main Display Area */}
      <div className="relative bg-gray-900 aspect-[4/3] flex items-center justify-center">
        {activeMedia === "photos" ? (
          <img
            src={displayImages[selectedImageIndex]}
            alt={title}
            className="w-full h-full object-contain"
          />
        ) : (
          <video 
            src={videoUrl || ""} 
            className="w-full h-full object-contain" 
            controls 
            autoPlay
          />
        )}
        
        <div className="absolute top-3 left-3 flex gap-2">
          {type && (
            <span className="bg-green-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1 capitalize">
              {type === "auction" ? "🔨 Auction" : type === "rental" ? "🏠 Rental" : "🛍️ Marketplace"}
            </span>
          )}
          {videoUrl && (
            <span className="bg-blue-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1">
              <Play className="w-3 h-3 fill-current" /> Video
            </span>
          )}
        </div>

        {onToggleFavorite && (
          <button
            onClick={onToggleFavorite}
            className={`absolute top-3 right-3 w-9 h-9 flex items-center justify-center rounded-full shadow-md transition ${isFavorite ? "bg-red-500 text-white" : "bg-white/90 text-gray-500 hover:bg-white"}`}
          >
            <Heart className={`w-4.5 h-4.5 ${isFavorite ? "fill-white" : ""}`} />
          </button>
        )}
      </div>

      {/* Thumbnails & Media Toggles */}
      <div className="p-3 bg-white border-t flex flex-col gap-3">
        {/* Media Type Toggles */}
        {videoUrl && (
          <div className="flex gap-2">
            <button
              onClick={() => setActiveMedia("photos")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${activeMedia === "photos" ? "bg-green-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
            >
              <ImageIcon className="w-3.5 h-3.5" /> Photos
            </button>
            <button
              onClick={() => setActiveMedia("video")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${activeMedia === "video" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
            >
              <Play className="w-3.5 h-3.5" /> Video
            </button>
          </div>
        )}

        {/* Photo Thumbnails */}
        {activeMedia === "photos" && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {displayImages.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedImageIndex(idx)}
                className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition ${selectedImageIndex === idx ? "border-green-500" : "border-transparent opacity-60 hover:opacity-100"}`}
              >
                <img src={img} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
