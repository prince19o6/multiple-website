import { handleImageError } from "@/lib/imageUtils";

interface TourCardProps {
  name: string;
  description: string;
  price: number;
  rating: number;
  image: string;
  duration: string;
  difficulty: string;
  onBook: () => void;
}

export default function TourCard({
  name,
  description,
  price,
  rating,
  image,
  duration,
  difficulty,
  onBook,
}: TourCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-2xl transition-shadow duration-300">
      {/* Image Container */}
      <div className="relative h-48 bg-gray-200">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          onError={handleImageError}
        />
        <div className="absolute top-3 right-3 bg-primary-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
          ⭐ {rating}
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="text-xl font-bold mb-2 text-gray-900">{name}</h3>

        {/* Quick Info */}
        <div className="flex gap-3 mb-3 text-sm text-gray-600">
          <span className="flex items-center gap-1">📅 {duration}</span>
          <span className="flex items-center gap-1">💪 {difficulty}</span>
        </div>

        <p className="text-gray-700 text-sm mb-4 line-clamp-2">{description}</p>

        {/* Footer */}
        <div className="flex justify-between items-center">
          <span className="text-2xl font-bold text-primary-600">${price}</span>
          <button
            onClick={onBook}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors font-semibold"
          >
            Book Now
          </button>
        </div>
      </div>
    </div>
  );
}