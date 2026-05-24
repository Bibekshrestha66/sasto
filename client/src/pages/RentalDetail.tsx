import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, MapPin, Star, Calendar, Bed, Bath, Maximize2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

// Match the same mock data as in RentalResponsive (including id 7)
const RENTALS_DATA = [
  {
    id: 1,
    title: "Luxury 2BHK Apartment in Thamel",
    pricePerDay: 25000,
    location: "Kathmandu, Bagmati",
    landlord: "PropertyPlus",
    rating: 4.8,
    image: "https://picsum.photos/id/106/800/500",
    description: "Fully furnished 2-bedroom apartment in Thamel. Includes WiFi, parking, and 24/7 security.",
    bedrooms: 2,
    bathrooms: 2,
    area: "800 sqft",
    furnished: true,
    amenities: ["WiFi", "Parking", "Security", "AC"],
  },
  {
    id: 2,
    title: "Honda City 2022 - Self Drive",
    pricePerDay: 4500,
    location: "Lalitpur, Bagmati",
    landlord: "DriveEasy",
    rating: 4.7,
    image: "https://picsum.photos/id/111/800/500",
    description: "Late model Honda City, automatic, full insurance.",
    bedrooms: 0,
    bathrooms: 0,
    area: "N/A",
    furnished: true,
    amenities: ["AC", "Automatic", "Bluetooth"],
  },
  {
    id: 3,
    title: "MacBook Pro M2 2023",
    pricePerDay: 1500,
    location: "Kathmandu, Bagmati",
    landlord: "TechRent",
    rating: 4.9,
    image: "https://picsum.photos/id/0/800/500",
    description: "MacBook Pro M2, 16GB RAM, 512GB SSD.",
    bedrooms: 0,
    bathrooms: 0,
    area: "N/A",
    furnished: true,
    amenities: ["M2 Chip", "16GB RAM", "Retina"],
  },
  {
    id: 4,
    title: "Professional Camera Kit",
    pricePerDay: 800,
    location: "Pokhara, Gandaki",
    landlord: "GearRental",
    rating: 4.6,
    image: "https://picsum.photos/id/96/800/500",
    description: "Canon 5D Mark IV with lens kit.",
    bedrooms: 0,
    bathrooms: 0,
    area: "N/A",
    furnished: true,
    amenities: ["Canon 5D", "24-70mm", "Tripod"],
  },
  {
    id: 5,
    title: "Commercial Space in New Road",
    pricePerDay: 55000,
    location: "Kathmandu, Bagmati",
    landlord: "BizSpace",
    rating: 4.7,
    image: "https://picsum.photos/id/48/800/500",
    description: "Ground floor commercial space, high foot traffic.",
    bedrooms: 0,
    bathrooms: 2,
    area: "1000 sqft",
    furnished: false,
    amenities: ["High Ceiling", "Street Facing", "Parking"],
  },
  {
    id: 6,
    title: "Modern Studio in Jhamsikhel",
    pricePerDay: 18000,
    location: "Lalitpur, Bagmati",
    landlord: "UrbanRentals",
    rating: 4.6,
    image: "https://picsum.photos/id/169/800/500",
    description: "Cozy studio, fully furnished.",
    bedrooms: 1,
    bathrooms: 1,
    area: "500 sqft",
    furnished: true,
    amenities: ["Balcony", "Study Desk", "WiFi"],
  },
  {
    id: 7,
    title: "Modern Luxury Villa",
    pricePerDay: 12500,
    location: "Pokhara Lakeside",
    landlord: "LuxuryStays",
    rating: 4.9,
    image: "https://picsum.photos/id/104/800/500",
    description: "Lake-view villa with pool and garden.",
    bedrooms: 3,
    bathrooms: 3,
    area: "2500 sqft",
    furnished: true,
    amenities: ["Pool", "Garden", "BBQ"],
  },
];

export default function RentalDetail() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(1);

  const rental = RENTALS_DATA.find((r) => r.id === parseInt(id || ""));

  if (!rental) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Rental Not Found</h1>
        <Button onClick={() => navigate("/rentals")}>Back to Rentals</Button>
      </div>
    );
  }

  const handleBook = () => {
    toast.success(`Booking request sent for ${rental.title}!`);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        <button
          onClick={() => navigate("/rentals")}
          className="flex items-center gap-2 text-gray-600 hover:text-purple-500 mb-6"
        >
          <ArrowLeft className="w-5 h-5" /> Back to Rentals
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="overflow-hidden">
              <div className="relative w-full bg-gray-50 flex items-center justify-center min-h-[300px]">
                <img
                  src={rental.image}
                  alt={rental.title}
                  className="w-full h-auto max-h-[70vh] object-contain mx-auto"
                  onError={(e) => (e.currentTarget.src = "https://picsum.photos/id/1/800/500")}
                />
              </div>
              <div className="p-6">
                <h1 className="text-2xl font-bold mb-3">{rental.title}</h1>
                <p className="text-gray-600 mb-6">{rental.description}</p>

                <div className="flex flex-wrap gap-4 mb-6 text-sm text-gray-600 border-b pb-4">
                  {rental.bedrooms > 0 && <div className="flex items-center gap-1"><Bed className="w-4 h-4" /> {rental.bedrooms} beds</div>}
                  {rental.bathrooms > 0 && <div className="flex items-center gap-1"><Bath className="w-4 h-4" /> {rental.bathrooms} baths</div>}
                  <div className="flex items-center gap-1"><Maximize2 className="w-4 h-4" /> {rental.area}</div>
                  {rental.furnished && <div className="flex items-center gap-1"><Star className="w-4 h-4 fill-yellow-500" /> Furnished</div>}
                </div>

                <h3 className="font-semibold text-lg mb-2">Amenities</h3>
                <div className="flex flex-wrap gap-2 mb-6">
                  {rental.amenities.map((a, i) => (
                    <span key={i} className="bg-gray-100 px-3 py-1 rounded-full text-xs">{a}</span>
                  ))}
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-semibold text-lg mb-2">Hosted by {rental.landlord}</h3>
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center font-bold">{rental.landlord[0]}</div>
                    <div>
                      <p className="font-semibold">{rental.landlord}</p>
                      <div className="flex items-center gap-1"><Star className="w-4 h-4 fill-yellow-500" /> {rental.rating} (120+ reviews)</div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <div>
            <Card className="p-6 sticky top-24">
              <p className="text-sm text-gray-500 mb-1">Price per day</p>
              <p className="text-3xl font-bold text-purple-600">NPR {rental.pricePerDay.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">+ taxes & fees</p>

              <div className="space-y-4 mt-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Check-in</label>
                  <input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} className="w-full border rounded-lg p-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Check-out</label>
                  <input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} className="w-full border rounded-lg p-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Guests</label>
                  <input type="number" min="1" value={guests} onChange={(e) => setGuests(parseInt(e.target.value))} className="w-full border rounded-lg p-2" />
                </div>
              </div>

              <Button onClick={handleBook} className="w-full mt-4 bg-purple-600 hover:bg-purple-700 rounded-full">Book Now</Button>
              <p className="text-center text-xs text-gray-500 mt-4">Free cancellation within 24h</p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}